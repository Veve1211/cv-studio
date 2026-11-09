import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Presentation mode: DEMO_ENABLED=1 on the server + opening the site with ?demo=1
 * unlocks every feature without payment, only in that browser, for 3 hours.
 * No account and no database: the end time lives in a signed, HttpOnly cookie.
 */
export const DEMO_COOKIE = "cvk_demo";
export const DEMO_HOURS = 3;

export function isDemoEnabled(): boolean {
  return process.env.DEMO_ENABLED === "1";
}

// Without any configured secret a per-process key still works (until a restart).
let fallbackKey: string | null = null;
function secret(): string {
  const configured =
    process.env.ACCESS_SECRET ||
    process.env.RATE_LIMIT_SECRET ||
    process.env.PDF_RENDER_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    process.env.ANTHROPIC_API_KEY;
  if (configured) return configured;
  fallbackKey ??= randomBytes(32).toString("base64url");
  return fallbackKey;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(`demo1:${payload}`).digest("base64url");
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  const hit = header.split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : null;
}

/** Unix seconds until which demo access is valid, or null. */
export function demoUntil(request: Request, now = Math.floor(Date.now() / 1000), key = secret()): number | null {
  if (!isDemoEnabled()) return null;
  const raw = readCookie(request.headers.get("cookie"), DEMO_COOKIE);
  if (!raw) return null;
  const [payload, mac] = raw.split(".");
  if (!payload || !mac) return null;
  const expected = sign(payload, key);
  if (mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  const until = Number(payload);
  if (!Number.isInteger(until) || until <= now || until > now + DEMO_HOURS * 3600 + 60) return null;
  return until;
}

export function hasDemoAccess(request: Request): boolean {
  return demoUntil(request) !== null;
}

/** Set-Cookie header that unlocks demo access for DEMO_HOURS. */
export function demoCookie(request: Request, now = Math.floor(Date.now() / 1000), key = secret()) {
  const until = now + DEMO_HOURS * 3600;
  const payload = String(until);
  const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  const header = [
    `${DEMO_COOKIE}=${payload}.${sign(payload, key)}`,
    "Path=/",
    `Max-Age=${DEMO_HOURS * 3600}`,
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
  return { until, header };
}
