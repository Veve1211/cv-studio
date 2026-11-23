import { takeAiBudget } from "./ai-budget";
import { hasDemoAccess } from "./demo";
import { jsonError } from "./http";
import { clientKey, createRateLimiter } from "./rate-limit";
import { cookieLimit } from "./rate-limit-cookie";

const WINDOW_SEC = 15 * 60;
/** Presentation mode gets a generous limit so a live demo never hits "too many tries". */
const DEMO_LIMIT = 60;

/**
 * Rate limit for the paid AI endpoints: per IP in memory + a signed cookie that
 * survives restarts. Returns an error response, or the Set-Cookie header to add.
 */
export function createAiLimit(scope: string, limit: number) {
  const limiter = createRateLimiter({ limit, windowMs: WINDOW_SEC * 1000 });
  const demoLimiter = createRateLimiter({
    limit: DEMO_LIMIT,
    windowMs: WINDOW_SEC * 1000,
  });

  return function check(
    request: Request,
  ): { error: Response } | { error: null; setCookie: string | null } {
    const demo = hasDemoAccess(request);
    const rate = (demo ? demoLimiter : limiter)(clientKey(request));
    if (!rate.ok) return { error: tooMany(rate.retryAfterSec) };
    const cookie = cookieLimit(request, {
      scope: demo ? `${scope}d` : scope,
      limit: demo ? DEMO_LIMIT : limit,
      windowSec: WINDOW_SEC,
    });
    if (!cookie.ok) return { error: tooMany(cookie.retryAfterSec) };
    // Presentation mode is exempt so a live demo never stops; everyone else shares the daily cap.
    if (!demo && !takeAiBudget()) return { error: dailyCapReached() };
    return { error: null, setCookie: cookie.setCookie };
  };
}

function dailyCapReached(): Response {
  return jsonError(
    "Cvéčko má pro dnešek vyčerpanou kapacitu. Zkus to prosím zítra – omlouváme se.",
    503,
    { "Retry-After": String(secondsUntilUtcMidnight()) },
  );
}

function secondsUntilUtcMidnight(now = new Date()): number {
  const midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.max(1, Math.ceil((midnight - now.getTime()) / 1000));
}

function tooMany(retryAfterSec: number): Response {
  return jsonError(
    "Moc pokusů za sebou. Zkus to prosím za chvíli znovu.",
    429,
    {
      "Retry-After": String(retryAfterSec),
    },
  );
}
