import { afterEach, describe, expect, it, vi } from "vitest";
import { accessCode, accessCookie, accessUntil, getPlan, parseAccessCode, planUntil, plans } from "./access";

const req = (cookie?: string) => new Request("https://cvecko.test/", { headers: cookie ? { cookie } : {} });
const KEY = "k";
const NOW = 1_800_000_000;

describe("paid access", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reads prices from the environment, with sane fallbacks", () => {
    vi.stubEnv("PRICE_14D_CZK", "149");
    vi.stubEnv("PRICE_YEAR_CZK", "nonsense");
    expect(plans().map((p) => [p.id, p.priceCzk])).toEqual([
      ["trial", 0],
      ["14d", 149],
      ["year", 299],
    ]);
    expect(planUntil(getPlan("14d")!, NOW)).toBe(NOW + 14 * 86_400);
  });

  it("the cookie is signed and expires", () => {
    const until = NOW + 3600;
    const cookie = accessCookie(req(), until, NOW, KEY).split(";")[0];
    expect(accessUntil(req(cookie), NOW, KEY)).toBe(until);
    expect(accessUntil(req(cookie), until + 1, KEY)).toBeNull();
    expect(accessUntil(req(cookie), NOW, "other")).toBeNull();
    expect(accessUntil(req(`cvk_access=${until + 999}.${cookie.split(".")[1]}`), NOW, KEY)).toBeNull();
  });

  it("the short code unlocks another device and cannot be forged", () => {
    const until = NOW + 14 * 86_400;
    const code = accessCode(until, KEY);
    expect(code).toMatch(/^CV-[0-9A-Z]+-[A-Z0-9]{8}$/);
    expect(parseAccessCode(code.toLowerCase(), NOW, KEY)).toBe(until);
    expect(parseAccessCode(` ${code} `, NOW, KEY)).toBe(until);
    const [, end, sig] = code.split("-");
    const longer = (parseInt(end, 36) + 86_400).toString(36).toUpperCase();
    expect(parseAccessCode(`CV-${longer}-${sig}`, NOW, KEY)).toBeNull();
    expect(parseAccessCode(code, until + 1, KEY)).toBeNull();
    expect(parseAccessCode("nonsense", NOW, KEY)).toBeNull();
  });
});
