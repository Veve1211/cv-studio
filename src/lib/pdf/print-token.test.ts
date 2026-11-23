import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidPrintToken, printRequestPolicy, printToken } from "./print-token";

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

describe("print request policy", () => {
  const origin = "http://127.0.0.1:3000";
  it("sends the secret only to this server", () => {
    expect(printRequestPolicy("http://127.0.0.1:3000/tisk", origin)).toBe("internal");
    expect(printRequestPolicy("http://127.0.0.1:3000/_next/static/a.js", origin)).toBe("internal");
  });
  it("blocks every other host, analytics included", () => {
    expect(printRequestPolicy("https://plausible.io/js/script.js", origin)).toBe("block");
    expect(printRequestPolicy("http://127.0.0.1:3001/tisk", origin)).toBe("block");
    expect(printRequestPolicy("http://localhost:3000/tisk", origin)).toBe("block");
    expect(printRequestPolicy("not a url", origin)).toBe("block");
  });
  it("lets inline data through without the header", () => {
    expect(printRequestPolicy("data:font/woff2;base64,AAAA", origin)).toBe("inline");
    expect(printRequestPolicy("blob:http://127.0.0.1:3000/x", origin)).toBe("inline");
  });
});
