import { afterEach, describe, expect, it, vi } from "vitest";
import { analyticsScript } from "./analytics";

afterEach(() => vi.unstubAllEnvs());

describe("analyticsScript", () => {
  it("is off by default", () => {
    vi.stubEnv("ANALYTICS_URL", "");
    expect(analyticsScript()).toBeNull();
  });
  it("accepts only https URLs", () => {
    vi.stubEnv("ANALYTICS_URL", "https://plausible.io/js/script.js");
    expect(analyticsScript()).toBe("https://plausible.io/js/script.js");
    vi.stubEnv("ANALYTICS_URL", "http://evil.example/x.js");
    expect(analyticsScript()).toBeNull();
    vi.stubEnv("ANALYTICS_URL", "javascript:alert(1)");
    expect(analyticsScript()).toBeNull();
  });
});
