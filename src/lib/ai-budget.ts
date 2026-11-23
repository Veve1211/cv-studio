// Global daily cap on AI calls (all visitors together). Per-visitor limits use the
// IP and a cookie, which a determined abuser can change; this cap keeps the API bill
// bounded anyway. Kept in memory (one Railway instance): it resets at midnight UTC
// and on restart. The spending limit in the Anthropic Console is the hard backstop.

const DEFAULT_DAILY_LIMIT = 300;

/** Daily cap from AI_DAILY_LIMIT (a positive whole number), else the default. */
export function dailyLimit(
  env: Record<string, string | undefined> = process.env,
): number {
  const n = Number(env.AI_DAILY_LIMIT);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_DAILY_LIMIT;
}

type Budget = { day: string; used: number };

/** Returns `take()`: true and counts the call while today's budget lasts, false after. */
export function createDailyBudget(
  limit: () => number,
  now: () => Date = () => new Date(),
  state: Budget = { day: "", used: 0 },
) {
  return function take(): boolean {
    // Tests run hundreds of mocked calls; the same switch disables the per-visitor limits.
    if (process.env.RATE_LIMIT_DISABLED === "1") return true;
    const today = now().toISOString().slice(0, 10);
    if (state.day !== today) {
      state.day = today;
      state.used = 0;
    }
    if (state.used >= limit()) return false;
    state.used += 1;
    return true;
  };
}

// One shared counter for every API route, even if the bundler loads this module twice.
const globalState = globalThis as typeof globalThis & {
  __cvkAiBudget?: Budget;
};
globalState.__cvkAiBudget ??= { day: "", used: 0 };

export const takeAiBudget = createDailyBudget(
  () => dailyLimit(),
  undefined,
  globalState.__cvkAiBudget,
);
