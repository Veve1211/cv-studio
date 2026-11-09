import { afterEach, describe, expect, it, vi } from "vitest";
import { demoCookie, demoUntil, DEMO_HOURS } from "./demo";

const req = (cookie?: string) => new Request("https://cvecko.test/api/checkout", { headers: cookie ? { cookie } : {} });
const KEY = "test-secret";

describe("presentation mode cookie", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is off without DEMO_ENABLED=1", () => {
    vi.stubEnv("DEMO_ENABLED", "");
    const { header } = demoCookie(req(), 1000, KEY);
    expect(demoUntil(req(header.split(";")[0]), 1000, KEY)).toBeNull();
  });

  it("unlocks for 3 hours with a valid signature", () => {
    vi.stubEnv("DEMO_ENABLED", "1");
    const { header, until } = demoCookie(req(), 1000, KEY);
    expect(until).toBe(1000 + DEMO_HOURS * 3600);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    const cookie = header.split(";")[0];
    expect(demoUntil(req(cookie), 1001, KEY)).toBe(until);
    expect(demoUntil(req(cookie), until + 1, KEY)).toBeNull();
  });

  it("rejects forged or extended cookies", () => {
    vi.stubEnv("DEMO_ENABLED", "1");
    const { header } = demoCookie(req(), 1000, KEY);
    const [, mac] = header.split(";")[0].split(".");
    expect(demoUntil(req(`cvk_demo=999999.${mac}`), 1000, KEY)).toBeNull();
    expect(demoUntil(req(header.split(";")[0]), 1000, "other-key")).toBeNull();
    // A far-future end time is refused even if signed.
    const far = demoCookie(req(), 100_000, KEY).header.split(";")[0];
    expect(demoUntil(req(far), 1000, KEY)).toBeNull();
  });
});
