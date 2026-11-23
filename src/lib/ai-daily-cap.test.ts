import { afterEach, describe, expect, it, vi } from "vitest";
import { aiDailyLimit, createDailyCap, DEFAULT_AI_DAILY_LIMIT } from "./ai-daily-cap";

afterEach(() => vi.unstubAllEnvs());

describe("AI daily cap", () => {
  it("allows the limit per UTC day, then waits for midnight", () => {
    let t = Date.UTC(2026, 10, 23, 22, 0, 0);
    const take = createDailyCap({ limit: () => 2, now: () => t });
    expect(take().ok).toBe(true);
    expect(take().ok).toBe(true);
    const blocked = take();
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(2 * 3600);
    t = Date.UTC(2026, 10, 24, 0, 0, 1);
    expect(take().ok).toBe(true);
  });

  it("0 switches it off", () => {
    const take = createDailyCap({ limit: () => 0 });
    for (let i = 0; i < 1000; i++) expect(take().ok).toBe(true);
  });

  it("reads AI_DAILY_LIMIT, falls back on nonsense", () => {
    expect(aiDailyLimit()).toBe(DEFAULT_AI_DAILY_LIMIT);
    vi.stubEnv("AI_DAILY_LIMIT", "50");
    expect(aiDailyLimit()).toBe(50);
    vi.stubEnv("AI_DAILY_LIMIT", "0");
    expect(aiDailyLimit()).toBe(0);
    vi.stubEnv("AI_DAILY_LIMIT", "lots");
    expect(aiDailyLimit()).toBe(DEFAULT_AI_DAILY_LIMIT);
  });
});
