import { describe, expect, it } from "vitest";
import { clientKey, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit, then blocks until the window resets", () => {
    let t = 0;
    const check = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
    expect(check("a").ok).toBe(true);
    expect(check("a").ok).toBe(true);
    const blocked = check("a");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(1);
    expect(check("b").ok).toBe(true);
    t = 1000;
    expect(check("a").ok).toBe(true);
  });
});

describe("clientKey", () => {
  it("uses the first forwarded IP", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(clientKey(req)).toBe("1.2.3.4");
  });
  it("falls back to unknown", () => {
    expect(clientKey(new Request("http://x"))).toBe("unknown");
  });
});
