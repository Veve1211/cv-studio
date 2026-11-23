/**
 * Safety net for the Claude bill: at most N AI calls per day for the whole server,
 * whoever sends them (per-IP limits alone can be spread over many addresses).
 * In memory, so a restart starts the day again; the Anthropic console spend limit
 * is the hard stop. AI_DAILY_LIMIT overrides the default, 0 switches it off.
 */
export const DEFAULT_AI_DAILY_LIMIT = 500;
const DAY_MS = 86_400_000;

export function aiDailyLimit(): number {
  const raw = process.env.AI_DAILY_LIMIT?.trim();
  if (!raw) return DEFAULT_AI_DAILY_LIMIT;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : DEFAULT_AI_DAILY_LIMIT;
}

export function createDailyCap(options: { limit: () => number; now?: () => number }) {
  const { limit, now = Date.now } = options;
  let day = -1;
  let count = 0;

  return function take(): { ok: boolean; retryAfterSec: number } {
    if (process.env.RATE_LIMIT_DISABLED === "1") return { ok: true, retryAfterSec: 0 };
    const max = limit();
    if (max === 0) return { ok: true, retryAfterSec: 0 };
    const t = now();
    const today = Math.floor(t / DAY_MS); // UTC day
    if (today !== day) {
      day = today;
      count = 0;
    }
    if (count >= max) return { ok: false, retryAfterSec: Math.ceil(((today + 1) * DAY_MS - t) / 1000) };
    count += 1;
    return { ok: true, retryAfterSec: 0 };
  };
}

/** One shared counter for every AI endpoint. */
export const takeAiCall = createDailyCap({ limit: aiDailyLimit });
