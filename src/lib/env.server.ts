import 'server-only';

/**
 * Server-only secrets. Importing this file from a client component is a build
 * error thanks to `server-only`, which is the guard that stops a secret from
 * ever being bundled into browser JavaScript.
 */

function required(key: string, minLength = 1): string {
  const value = process.env[key];
  if (!value || value.length < minLength) {
    throw new Error(
      `Missing or invalid environment variable ${key}. ` +
        `Copy .env.example to .env and set it. See README.md > Environment variables.`,
    );
  }
  return value;
}

/** Signing key for customer and admin session tokens. */
export const authSecret = (): Uint8Array => {
  const secret = required('AUTH_SECRET', 32);
  if (secret.startsWith('[')) {
    throw new Error('AUTH_SECRET is still a placeholder. Generate one with: openssl rand -base64 48');
  }
  return new TextEncoder().encode(secret);
};

/**
 * M-Pesa Daraja credentials. NOT USED YET — no automated payment integration
 * is implemented. `isConfigured` is the switch a future integration should
 * check before attempting any call.
 */
export const mpesa = {
  consumerKey: process.env.MPESA_CONSUMER_KEY ?? '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET ?? '',
  shortcode: process.env.MPESA_SHORTCODE ?? '',
  passkey: process.env.MPESA_PASSKEY ?? '',
  environment: process.env.MPESA_ENVIRONMENT ?? 'sandbox',
  callbackUrl: process.env.MPESA_CALLBACK_URL ?? '',
  get isConfigured() {
    return Boolean(this.consumerKey && this.consumerSecret && this.shortcode && this.passkey);
  },
};
