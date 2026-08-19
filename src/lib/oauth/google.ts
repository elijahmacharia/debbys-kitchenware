import 'server-only';

import { siteUrl } from '@/lib/config';

/**
 * Google sign-in, implemented directly against Google's OAuth 2.0 endpoints.
 *
 * Written by hand rather than pulling in a full auth framework, because this
 * project already has its own session cookies, its own customer table and its
 * own password handling. Adopting a framework would have meant replacing all
 * three to gain one button. The whole flow is about a hundred lines and uses
 * only documented, stable endpoints.
 *
 * The flow, in order:
 *   1. /api/auth/google        sends the browser to Google with a random state
 *   2. Google                  asks the person to approve, then redirects back
 *   3. /api/auth/google/callback  checks the state, swaps the code for tokens,
 *                              reads the identity out of the id_token
 *
 * The `state` value guards against cross-site request forgery: an attacker can
 * make a browser hit our callback, but cannot guess the random value we stored
 * in a cookie moments earlier, so a forged callback is rejected.
 */

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export const GOOGLE_STATE_COOKIE = 'dk_oauth_state';
/** Where to send the person once they are signed in. Set alongside the state. */
export const GOOGLE_NEXT_COOKIE = 'dk_oauth_next';

export interface GoogleIdentity {
  /** Google's stable identifier for the account. Never reused, never changes. */
  googleId: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
}

export function googleConfig() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
  return {
    clientId,
    clientSecret,
    redirectUri: `${siteUrl}/api/auth/google/callback`,
    configured: Boolean(clientId && clientSecret),
  };
}

export function googleAuthUrl(state: string): string {
  const { clientId, redirectUri } = googleConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    // Ask for an account chooser every time. Without this, someone on a shared
    // phone is silently signed in as whoever used it last.
    prompt: 'select_account',
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Reads the claims out of a Google id_token.
 *
 * The signature is deliberately not verified here, and that is safe in this
 * one specific case: the token was just fetched over TLS directly from
 * Google's token endpoint in a server-to-server request, using our client
 * secret. It did not pass through the browser, so there was no opportunity for
 * anyone to substitute it. Google documents this exact exemption.
 *
 * If this token were ever accepted from the client instead, the signature
 * would have to be checked against Google's published keys first.
 */
function readIdToken(idToken: string): GoogleIdentity | null {
  const parts = idToken.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const claims = JSON.parse(json) as Record<string, unknown>;
    const sub = typeof claims.sub === 'string' ? claims.sub : '';
    const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : '';
    if (!sub || !email) return null;
    return {
      googleId: sub,
      email,
      name: typeof claims.name === 'string' && claims.name.trim() ? claims.name.trim() : null,
      emailVerified: claims.email_verified === true || claims.email_verified === 'true',
    };
  } catch {
    return null;
  }
}

/** Swaps the one-time code for tokens and returns who signed in. */
export async function exchangeCodeForIdentity(code: string): Promise<GoogleIdentity | null> {
  const { clientId, clientSecret, redirectUri, configured } = googleConfig();
  if (!configured) return null;

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    // The body can contain the client secret in an echoed request, so only the
    // status is logged.
    console.error('[google-oauth] token exchange failed with status', response.status);
    return null;
  }

  const data = (await response.json()) as { id_token?: string };
  return data.id_token ? readIdToken(data.id_token) : null;
}
