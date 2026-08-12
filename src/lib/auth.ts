import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { authSecret } from './env.server';
import { db } from '@/db';
import { adminUsers, customers } from '@/db/schema';

/**
 * Session handling for two completely separate audiences: shop customers and
 * store staff. They use different cookies AND different JWT audiences, so a
 * customer token can never be replayed against an admin route even though the
 * signing key is shared.
 */

export const CUSTOMER_COOKIE = 'dk_customer_session';
export const ADMIN_COOKIE = 'dk_admin_session';
/** Guests get an opaque cookie so they can view the order they just placed. */
export const GUEST_ORDERS_COOKIE = 'dk_guest_orders';

const CUSTOMER_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const ADMIN_MAX_AGE = 60 * 60 * 8;          // 8 hours — staff sessions end same-day
const BCRYPT_ROUNDS = 12;

export type Audience = 'customer' | 'admin';
export interface SessionPayload { sub: string; aud: Audience; name: string; role?: string }

// --- Passwords ---------------------------------------------------------------

export const hashPassword = (plain: string) => bcrypt.hash(plain, BCRYPT_ROUNDS);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/**
 * Runs a bcrypt comparison against a throwaway hash. Called when a login
 * attempt names an account that does not exist, so "unknown account" and
 * "wrong password" take a similar amount of time and cannot be told apart by
 * an attacker enumerating phone numbers.
 */
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.7NwzZoJ5F1kQhOWk8lF8jGJc/lJ4gEq';
export const wastePasswordTime = async () => {
  await bcrypt.compare('not-a-real-password', DUMMY_HASH);
};

// --- Tokens ------------------------------------------------------------------

async function signSession(payload: SessionPayload, maxAgeSeconds: number): Promise<string> {
  return new SignJWT({ name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setAudience(payload.aud)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(authSecret());
}

async function readSession(token: string, audience: Audience): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, authSecret(), { audience });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      aud: audience,
      name: String(payload.name ?? ''),
      role: payload.role ? String(payload.role) : undefined,
    };
  } catch {
    // Expired, tampered with, or signed for the other audience.
    return null;
  }
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true as const,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge,
});

// --- Customer sessions -------------------------------------------------------

export async function startCustomerSession(customer: { id: string; name: string }) {
  const token = await signSession({ sub: customer.id, aud: 'customer', name: customer.name }, CUSTOMER_MAX_AGE);
  (await cookies()).set(CUSTOMER_COOKIE, token, cookieOptions(CUSTOMER_MAX_AGE));
}

export async function endCustomerSession() {
  (await cookies()).set(CUSTOMER_COOKIE, '', cookieOptions(0));
}

/** Session payload only — cheap, no database round trip. */
export async function getCustomerSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  return token ? readSession(token, 'customer') : null;
}

/**
 * Loads the customer record and re-checks that the account still exists and is
 * active. A valid signature is not enough: an account may have been disabled
 * since the token was issued.
 */
export async function getCurrentCustomer() {
  const session = await getCustomerSession();
  if (!session) return null;
  const [customer] = await db
    .select({
      id: customers.id, name: customers.name, phone: customers.phone, email: customers.email,
      isActive: customers.isActive, marketingOptIn: customers.marketingOptIn, createdAt: customers.createdAt,
    })
    .from(customers)
    .where(eq(customers.id, session.sub))
    .limit(1);
  if (!customer || !customer.isActive) return null;
  return customer;
}

// --- Admin sessions ----------------------------------------------------------

export async function startAdminSession(admin: { id: string; name: string; role: string }) {
  const token = await signSession({ sub: admin.id, aud: 'admin', name: admin.name, role: admin.role }, ADMIN_MAX_AGE);
  (await cookies()).set(ADMIN_COOKIE, token, cookieOptions(ADMIN_MAX_AGE));
}

export async function endAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, '', cookieOptions(0));
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return token ? readSession(token, 'admin') : null;
}

export async function getCurrentAdmin() {
  const session = await getAdminSession();
  if (!session) return null;
  const [admin] = await db
    .select({
      id: adminUsers.id, name: adminUsers.name, email: adminUsers.email,
      role: adminUsers.role, isActive: adminUsers.isActive,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, session.sub))
    .limit(1);
  if (!admin || !admin.isActive) return null;
  return admin;
}

// --- Guest order access ------------------------------------------------------

/**
 * Guests have no account but must still be able to open the confirmation page
 * for the order they just placed — and must not be able to open anyone else's.
 * We record the order's publicId in an httpOnly cookie at creation time and
 * check membership on read. Guessing another id is infeasible.
 */
export async function grantGuestOrderAccess(publicId: string) {
  const jar = await cookies();
  const existing = (jar.get(GUEST_ORDERS_COOKIE)?.value ?? '').split(',').filter(Boolean);
  const next = Array.from(new Set([publicId, ...existing])).slice(0, 20);
  jar.set(GUEST_ORDERS_COOKIE, next.join(','), cookieOptions(60 * 60 * 24 * 60));
}

export async function hasGuestOrderAccess(publicId: string): Promise<boolean> {
  const raw = (await cookies()).get(GUEST_ORDERS_COOKIE)?.value ?? '';
  return raw.split(',').filter(Boolean).includes(publicId);
}

// --- Password reset tokens ---------------------------------------------------

/**
 * Returns the raw token (goes in the emailed link) and the SHA-256 hash (the
 * only form stored). A leaked database therefore cannot be used to reset
 * anyone's password.
 */
export function createResetToken() {
  const raw = randomBytes(32).toString('hex');
  return { raw, hash: createHash('sha256').update(raw).digest('hex') };
}

export const hashResetToken = (raw: string) => createHash('sha256').update(raw).digest('hex');
