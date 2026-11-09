import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidPrintToken, printToken } from "./print-token";

afterEach(() => vi.unstubAllEnvs());

describe("print token", () => {
  it("is derived from the server secret and verified in constant time", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_a");
    const token = printToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(isValidPrintToken(token)).toBe(true);
    expect(isValidPrintToken(token.replace(/.$/, "0"))).toBe(token.endsWith("0"));
    expect(isValidPrintToken("")).toBe(false);
    expect(isValidPrintToken(null)).toBe(false);
  });

  it("changes with the secret and is disabled without one", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_a");
    const a = printToken();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_b");
    expect(printToken()).not.toBe(a);
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("PDF_RENDER_SECRET", "");
    expect(printToken()).toBe("");
    expect(isValidPrintToken("anything")).toBe(false);
  });
});
