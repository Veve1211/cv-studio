import { describe, expect, it } from "vitest";
import { pdfFileTitle } from "./pdf";

describe("pdfFileTitle", () => {
  it("builds an ASCII file name", () => {
    expect(pdfFileTitle("Tereza Nováková")).toBe("Zivotopis-Tereza-Novakova");
    expect(pdfFileTitle("  Žofie Dvořáková-Šťastná ")).toBe("Zivotopis-Zofie-Dvorakova-Stastna");
  });
  it("strips anything unsafe", () => {
    expect(pdfFileTitle('<script>"x"/..\\')).toBe("Zivotopis-script-x");
    expect(pdfFileTitle("")).toBe("Zivotopis");
  });
});
