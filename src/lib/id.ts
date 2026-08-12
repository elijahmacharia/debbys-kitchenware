import { randomBytes } from 'crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Collision-resistant random id, 24 characters of [a-z0-9].
 *
 * Used for every primary key. Sequential integers would let anyone walk
 * /order-confirmation/1, /order-confirmation/2 and read other people's orders;
 * ~124 bits of entropy makes that infeasible. Uses the crypto RNG so ids are
 * not predictable from one another.
 */
export function createId(length = 24): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}
