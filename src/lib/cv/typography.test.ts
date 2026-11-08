import { describe, expect, it } from "vitest";
import { czechTypo, plainText } from "./typography";

describe("czechTypo", () => {
  it("binds one-letter words to the next word", () => {
    expect(czechTypo("Pracuji v Brně a v Praze")).toBe("Pracuji v Brně a v Praze");
    expect(czechTypo("K tomu i Excel")).toBe("K tomu i Excel");
  });
  it("leaves other words alone", () => {
    expect(czechTypo("Figma, HTML a CSS")).toBe("Figma, HTML a CSS");
    expect(czechTypo("Vitamín C")).toBe("Vitamín C");
  });
  it("round-trips with plainText", () => {
    expect(plainText(czechTypo("Pracuji v Brně"))).toBe("Pracuji v Brně");
  });
});
