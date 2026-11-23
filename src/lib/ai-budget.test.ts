import { describe, expect, it } from "vitest";

import { createDailyBudget, dailyLimit } from "./ai-budget";

describe("daily AI budget", () => {
  it("allows calls up to the limit and then refuses", () => {
    const take = createDailyBudget(
      () => 3,
      () => new Date("2026-11-23T10:00:00Z"),
    );
    expect([take(), take(), take(), take()]).toEqual([true, true, true, false]);
  });

  it("starts again on a new day", () => {
    let now = new Date("2026-11-23T23:59:00Z");
    const take = createDailyBudget(
      () => 1,
      () => now,
    );
    expect(take()).toBe(true);
    expect(take()).toBe(false);
    now = new Date("2026-11-24T00:00:00Z");
    expect(take()).toBe(true);
  });

  it("reads AI_DAILY_LIMIT and falls back to 300 for invalid values", () => {
    expect(dailyLimit({ AI_DAILY_LIMIT: "50" })).toBe(50);
    expect(dailyLimit({})).toBe(300);
    expect(dailyLimit({ AI_DAILY_LIMIT: "0" })).toBe(300);
    expect(dailyLimit({ AI_DAILY_LIMIT: "abc" })).toBe(300);
    expect(dailyLimit({ AI_DAILY_LIMIT: "2.5" })).toBe(300);
  });
});
