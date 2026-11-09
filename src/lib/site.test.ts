import { afterEach, describe, expect, it, vi } from "vitest";
import { kofiUrl, SITE_NAME, SITE_TAGLINE } from "./site";

describe("site constants", () => {
  it("has a Czech name and tagline", () => {
    expect(SITE_NAME).toBe("Cvéčko");
    expect(SITE_TAGLINE).toContain("životopis");
  });
});

describe("kofiUrl", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("only accepts a plain https link", () => {
    vi.stubEnv("KOFI_URL", "");
    expect(kofiUrl()).toBeNull();
    vi.stubEnv("KOFI_URL", "javascript:alert(1)");
    expect(kofiUrl()).toBeNull();
    vi.stubEnv("KOFI_URL", "http://ko-fi.com/x");
    expect(kofiUrl()).toBeNull();
    vi.stubEnv("KOFI_URL", " https://ko-fi.com/cvecko ");
    expect(kofiUrl()).toBe("https://ko-fi.com/cvecko");
  });
});
