import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { GOOGLE_NEXT_COOKIE, GOOGLE_STATE_COOKIE, googleAuthUrl, googleConfig } from '@/lib/oauth/google';

/**
 * Step one of Google sign-in: send the browser to Google.
 *
 * A random `state` is minted here and stored in a short-lived HttpOnly cookie.
 * The callback will only proceed if Google hands back the same value, which is
 * what stops someone from forging a sign-in by pointing a victim's browser at
 * our callback URL.
 *
 * The page to return to is stored in its own cookie rather than smuggled
 * inside `state`, so the state stays a pure random value with one job.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!googleConfig().configured) {
    // Not an error the customer caused. Send them to the normal sign-in page
    // with an explanation rather than showing a broken screen.
    return NextResponse.redirect(new URL('/login?error=google-unavailable', request.url));
  }

  const requested = new URL(request.url).searchParams.get('next') ?? '/account';
  // Only ever redirect within this site: an open redirect here would let a
  // phishing page borrow our domain to look legitimate.
  const safeNext = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/account';

  const state = randomBytes(24).toString('base64url');
  const jar = await cookies();
  const options = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 10 * 60,
  };
  jar.set(GOOGLE_STATE_COOKIE, state, options);
  jar.set(GOOGLE_NEXT_COOKIE, safeNext, options);

  return NextResponse.redirect(googleAuthUrl(state));
}
