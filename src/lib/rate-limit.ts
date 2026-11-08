/**
 * Tiny in-memory fixed-window rate limiter. Good enough for a single Railway
 * instance; it resets on restart. Keys are client IPs, never user content.
 */
export function createRateLimiter(options: { limit: number; windowMs: number; now?: () => number }) {
  const { limit, windowMs, now = Date.now } = options;
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function check(key: string): { ok: boolean; retryAfterSec: number } {
    const t = now();
    // Opportunistic cleanup so the map cannot grow forever.
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);
    }
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= t) {
      hits.set(key, { count: 1, resetAt: t + windowMs });
      return { ok: true, retryAfterSec: 0 };
    }
    if (entry.count >= limit) {
      return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - t) / 1000) };
    }
    entry.count += 1;
    return { ok: true, retryAfterSec: 0 };
  };
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return ip.slice(0, 64);
}
