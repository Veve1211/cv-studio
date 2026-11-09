import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookieLimit, readState } from "./rate-limit-cookie";

const req = (cookie?: string) =>
  new Request("https://cvecko.example/api/cv", { headers: cookie ? { cookie } : {} });
const cookieOf = (setCookie: string | null) => setCookie!.split(";")[0];

describe("cookie rate limit", () => {
  beforeEach(() => {
    vi.stubEnv("RATE_LIMIT_DISABLED", "");
    vi.stubEnv("RATE_LIMIT_SECRET", "test-secret");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("counts requests in a signed cookie and blocks at the limit", () => {
    let cookie = "";
    for (let i = 0; i < 3; i++) {
      const r = cookieLimit(req(cookie), { scope: "cv", limit: 3, windowSec: 900, now: 1000 });
      expect(r.ok).toBe(true);
      expect(r.setCookie).toContain("HttpOnly");
      expect(r.setCookie).toContain("Secure");
      cookie = cookieOf(r.setCookie);
    }
    const blocked = cookieLimit(req(cookie), { scope: "cv", limit: 3, windowSec: 900, now: 1100 });
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(800);
    // after the window it starts over
    expect(cookieLimit(req(cookie), { scope: "cv", limit: 3, windowSec: 900, now: 1900 }).ok).toBe(true);
  });

  it("survives a 'restart' because the state is in the cookie, not in memory", async () => {
    const first = cookieLimit(req(), { scope: "cv", limit: 1, windowSec: 900, now: 1000 });
    vi.resetModules();
    const { cookieLimit: fresh } = await import("./rate-limit-cookie");
    expect(fresh(req(cookieOf(first.setCookie)), { scope: "cv", limit: 1, windowSec: 900, now: 1010 }).ok).toBe(false);
  });

  it("ignores forged or tampered cookies", () => {
    const r = cookieLimit(req(), { scope: "cv", limit: 5, windowSec: 900, now: 1000 });
    const [name, value] = cookieOf(r.setCookie).split("=");
    const [, mac] = value.split(".");
    expect(readState(`${name}=1000-0.${mac}`, "cv")).toBeNull();
    expect(readState(`${name}=garbage`, "cv")).toBeNull();
    vi.stubEnv("RATE_LIMIT_SECRET", "other");
    expect(readState(cookieOf(r.setCookie), "cv")).toBeNull();
  });

  it("is a no-op without any secret", () => {
    vi.stubEnv("RATE_LIMIT_SECRET", "");
    vi.stubEnv("PDF_RENDER_SECRET", "");
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(cookieLimit(req(), { scope: "cv", limit: 1, windowSec: 900 })).toEqual({ ok: true, retryAfterSec: 0, setCookie: null });
  });
});
