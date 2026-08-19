import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { startCustomerSession } from '@/lib/auth';
import {
  GOOGLE_NEXT_COOKIE,
  GOOGLE_STATE_COOKIE,
  exchangeCodeForIdentity,
  googleConfig,
} from '@/lib/oauth/google';

/**
 * Step two of Google sign-in: Google sends the browser back here.
 *
 * Account matching, which is the part worth getting right:
 *   - a customer already linked to this Google account   -> sign them in
 *   - a customer with the same email but no Google link  -> link and sign in
 *   - nobody                                             -> create the account
 *
 * The middle case only happens when Google says the address is verified. That
 * check is what stops someone creating a Google account claiming an email they
 * do not control and taking over an existing shop account with it.
 */
export const dynamic = 'force-dynamic';

/** Sends the customer back to sign-in with a message they can act on. */
function bounce(request: Request, reason: string) {
  return NextResponse.redirect(new URL(`/login?error=${reason}`, request.url));
}

export async function GET(request: Request) {
  if (!googleConfig().configured) return bounce(request, 'google-unavailable');

  const url = new URL(request.url);
  const jar = await cookies();
  const expectedState = jar.get(GOOGLE_STATE_COOKIE)?.value;
  const nextPath = jar.get(GOOGLE_NEXT_COOKIE)?.value ?? '/account';

  // Single use: clear both immediately, whatever the outcome.
  const clear = { path: '/', maxAge: 0 };
  jar.set(GOOGLE_STATE_COOKIE, '', clear);
  jar.set(GOOGLE_NEXT_COOKIE, '', clear);

  // The person pressed "Cancel" on Google's screen. Not an error worth shouting about.
  if (url.searchParams.get('error')) return NextResponse.redirect(new URL('/login', request.url));

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state || !expectedState || state !== expectedState) return bounce(request, 'google-state');

  const identity = await exchangeCodeForIdentity(code);
  if (!identity) return bounce(request, 'google-failed');
  if (!identity.emailVerified) return bounce(request, 'google-unverified');

  try {
    const [byGoogleId] = await db.select().from(customers).where(eq(customers.googleId, identity.googleId)).limit(1);

    let account = byGoogleId;

    if (!account) {
      const [byEmail] = await db.select().from(customers).where(eq(customers.email, identity.email)).limit(1);
      if (byEmail) {
        // Same person, signing in a different way. Link the two rather than
        // refusing, and fill in a name if the account never had one.
        const [linked] = await db
          .update(customers)
          .set({ googleId: identity.googleId, name: byEmail.name ?? identity.name, updatedAt: new Date() })
          .where(eq(customers.id, byEmail.id))
          .returning();
        account = linked;
      } else {
        const [created] = await db
          .insert(customers)
          .values({
            email: identity.email,
            name: identity.name,
            googleId: identity.googleId,
            // No passwordHash: this account signs in through Google. The
            // password reset flow can add one later if they want both.
            lastLoginAt: new Date(),
          })
          .returning();
        account = created;
      }
    }

    if (!account.isActive) return bounce(request, 'account-disabled');

    await db.update(customers).set({ lastLoginAt: new Date() }).where(eq(customers.id, account.id));
    await startCustomerSession(account);

    return NextResponse.redirect(new URL(nextPath, request.url));
  } catch (error) {
    console.error('[google-oauth] sign-in failed', error);
    return bounce(request, 'google-failed');
  }
}
