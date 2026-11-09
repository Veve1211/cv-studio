import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { demoUntil } from "./demo";
import { isPaywallEnabled } from "./payments/checkout";

/**
 * Paid access without accounts or a database: the end date lives in a signed, HttpOnly
 * cookie (HMAC from ACCESS_SECRET). A short code carries the same signed end date, so the
 * user can unlock another device ("Mám kód"). Paid actions are checked on the server.
 */
export const ACCESS_COOKIE = "cvk_access";
export const TRIAL_COOKIE = "cvk_trial";
const DAY = 86_400;

export type PlanId = "trial" | "14d" | "year";

export interface Plan {
  id: PlanId;
  name: string;
  days: number;
  priceCzk: number;
}

function price(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n > 0 && n < 100_000 ? n : fallback;
}

/** Prices come from PRICE_14D_CZK / PRICE_YEAR_CZK (read at runtime). */
export function plans(): Plan[] {
  return [
    { id: "trial", name: "1 den zdarma", days: 1, priceCzk: 0 },
    { id: "14d", name: "14 dní", days: 14, priceCzk: price("PRICE_14D_CZK", 99) },
    { id: "year", name: "1 rok", days: 365, priceCzk: price("PRICE_YEAR_CZK", 299) },
  ];
}

export function getPlan(id: string): Plan | null {
  return plans().find((p) => p.id === id) ?? null;
}

let fallbackKey: string | null = null;
function secret(): string {
  const configured =
    process.env.ACCESS_SECRET || process.env.RATE_LIMIT_SECRET || process.env.PDF_RENDER_SECRET || process.env.STRIPE_SECRET_KEY;
  if (configured) return configured;
  fallbackKey ??= randomBytes(32).toString("base64url");
  return fallbackKey;
}

function mac(payload: string, key: string, length = 43): string {
  return createHmac("sha256", key).update(`access1:${payload}`).digest("base64url").slice(0, length);
}

function same(a: string, b: string): boolean {
  return a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  const hit = header.split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : null;
}

const MAX_SEC = 400 * DAY;

function validUntil(until: number, now: number): boolean {
  return Number.isInteger(until) && until > now && until <= now + MAX_SEC;
}

/** Unix seconds until which this browser has paid access (cookie), or null. */
export function accessUntil(request: Request, now = Math.floor(Date.now() / 1000), key = secret()): number | null {
  const raw = readCookie(request.headers.get("cookie"), ACCESS_COOKIE);
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig || !same(sig, mac(payload, key))) return null;
  const until = Number(payload);
  return validUntil(until, now) ? until : null;
}

/** Everything unlocked: payments off, presentation mode, or paid access. */
export function hasFullAccess(request: Request): boolean {
  return !isPaywallEnabled() || demoUntil(request) !== null || accessUntil(request) !== null;
}

function secure(request: Request): boolean {
  return new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
}

export function accessCookie(request: Request, until: number, now = Math.floor(Date.now() / 1000), key = secret()): string {
  const payload = String(until);
  return [
    `${ACCESS_COOKIE}=${payload}.${mac(payload, key)}`,
    "Path=/",
    `Max-Age=${Math.max(0, until - now)}`,
    "HttpOnly",
    "SameSite=Lax",
    secure(request) ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

/** Remembers that the free day was used (once per browser). */
export function trialCookie(request: Request): string {
  return [`${TRIAL_COOKIE}=1`, "Path=/", `Max-Age=${5 * 365 * DAY}`, "HttpOnly", "SameSite=Lax", secure(request) ? "Secure" : ""]
    .filter(Boolean)
    .join("; ");
}

export function trialUsed(request: Request): boolean {
  return readCookie(request.headers.get("cookie"), TRIAL_COOKIE) === "1";
}

/** "CV-<end in base36>-<signature>", e.g. CV-T5K2QX-7HF3KD2A. Case-insensitive. */
export function accessCode(until: number, key = secret()): string {
  const end = until.toString(36).toUpperCase();
  return `CV-${end}-${codeSig(end, key)}`;
}

function codeSig(end: string, key: string): string {
  // Base32-ish (no 0/O/1/I confusion), 8 chars = 40 bits; redemption is rate limited.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = createHmac("sha256", key).update(`code1:${end}`).digest();
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export function parseAccessCode(code: string, now = Math.floor(Date.now() / 1000), key = secret()): number | null {
  const m = code.trim().toUpperCase().replace(/\s+/g, "").match(/^CV-([0-9A-Z]{1,8})-([A-Z0-9]{8})$/);
  if (!m) return null;
  if (!same(m[2], codeSig(m[1], key))) return null;
  const until = parseInt(m[1], 36);
  return validUntil(until, now) ? until : null;
}

/** End of access for a plan bought (or started) at `start`. */
export function planUntil(plan: Plan, start: number): number {
  return start + plan.days * DAY;
}
