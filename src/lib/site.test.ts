import { describe, expect, it } from "vitest";
import { SITE_NAME, SITE_TAGLINE } from "./site";

describe("site constants", () => {
  it("has a Czech name and tagline", () => {
    expect(SITE_NAME).toBe("Cvéčko");
    expect(SITE_TAGLINE).toContain("životopis");
  });
});
