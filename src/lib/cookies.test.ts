import { describe, expect, it } from "vitest";
import { isSecureRequest, readCookie } from "./cookies";

describe("cookies", () => {
  it("reads one cookie by exact name", () => {
    expect(readCookie("a=1; cvk_access=123.sig; b=2", "cvk_access")).toBe("123.sig");
    expect(readCookie("xcvk_access=1", "cvk_access")).toBeNull();
    expect(readCookie(null, "cvk_access")).toBeNull();
  });

  it("detects HTTPS directly or behind the proxy", () => {
    expect(isSecureRequest(new Request("https://cvecko.test/"))).toBe(true);
    expect(isSecureRequest(new Request("http://cvecko.test/", { headers: { "x-forwarded-proto": "https" } }))).toBe(true);
    expect(isSecureRequest(new Request("http://localhost/"))).toBe(false);
  });
});
