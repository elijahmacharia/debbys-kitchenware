import 'server-only';

/**
 * In-memory fixed-window rate limiter.
 *
 * Deliberately simple: it protects a single server instance against credential
 * stuffing and form spam with no extra infrastructure. It does NOT survive a
 * restart and does NOT coordinate across instances — if you scale to more than
 * one server, swap the Map for Redis or Upstash. The call sites do not change.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Stops the map growing without bound on a long-running server. */
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}

export interface RateLimitResult { ok: boolean; remaining: number; retryAfterSeconds: number }

export function rateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
  if (existing.count > limit) return { ok: false, remaining: 0, retryAfterSeconds };
  return { ok: true, remaining: limit - existing.count, retryAfterSeconds };
}

/** Best-effort client identity behind a proxy. Used only for rate limiting. */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  const ip = forwarded.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
  return `${scope}:${ip}`;
}
