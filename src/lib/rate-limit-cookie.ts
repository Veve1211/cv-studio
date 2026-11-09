import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Restart-proof part of the rate limit, without a database: the request count lives in
 * a signed, HttpOnly cookie. The server can always trust it (HMAC), so it keeps working
 * after a restart or on another instance. Someone who deletes the cookie still meets the
 * in-memory per-IP limit. Technical cookie: no personal data, only a number and a time.
 */
export const RATE_COOKIE = "cvk_rl";

function secret(): string {
  return (
    process.env.RATE_LIMIT_SECRET ||
    process.env.PDF_RENDER_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    ""
  );
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(`rl1:${payload}`).digest("base64url");
}

interface State {
  start: number; // window start, unix seconds
  count: number;
}

export function readState(cookieHeader: string | null, scope: string, key = secret()): State | null {
  if (!cookieHeader || !key) return null;
  const raw = cookieHeader
    .split(/;\s*/)
    .find((c) => c.startsWith(`${RATE_COOKIE}_${scope}=`))
    ?.slice(RATE_COOKIE.length + scope.length + 2);
  if (!raw) return null;
  const [payload, mac] = raw.split(".");
  if (!payload || !mac) return null;
  const expected = sign(payload, key);
  if (mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  const [start, count] = payload.split("-").map(Number);
  if (!Number.isInteger(start) || !Number.isInteger(count) || count < 0) return null;
  return { start, count };
}

export function cookieLimit(
  request: Request,
  options: { scope: string; limit: number; windowSec: number; now?: number },
): { ok: boolean; retryAfterSec: number; setCookie: string | null } {
  const key = secret();
  if (!key || process.env.RATE_LIMIT_DISABLED === "1") return { ok: true, retryAfterSec: 0, setCookie: null };
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const state = readState(request.headers.get("cookie"), options.scope, key);
  const fresh = !state || now - state.start >= options.windowSec || state.start > now + 60;
  const start = fresh ? now : state.start;
  const count = fresh ? 0 : state.count;
  if (count >= options.limit) {
    return { ok: false, retryAfterSec: Math.max(1, start + options.windowSec - now), setCookie: null };
  }
  const payload = `${start}-${count + 1}`;
  const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  const setCookie = [
    `${RATE_COOKIE}_${options.scope}=${payload}.${sign(payload, key)}`,
    "Path=/api",
    `Max-Age=${options.windowSec}`,
    "HttpOnly",
    "SameSite=Strict",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
  return { ok: true, retryAfterSec: 0, setCookie };
}
