import { describe, expect, it } from "vitest";
import { setCvText } from "./path";
import { SAMPLE_CV } from "./sample";

describe("setCvText", () => {
  it("updates nested strings without mutating the original", () => {
    const next = setCvText(SAMPLE_CV, "experience.1.role", "Designérka");
    expect(next.experience[1].role).toBe("Designérka");
    expect(SAMPLE_CV.experience[1].role).toBe("UX/UI designérka");
    expect(setCvText(SAMPLE_CV, "contact.email", "x@y.cz").contact.email).toBe("x@y.cz");
    expect(setCvText(SAMPLE_CV, "skills.0", "Sketch").skills[0]).toBe("Sketch");
  });

  it("ignores invalid or dangerous paths", () => {
    expect(setCvText(SAMPLE_CV, "__proto__.polluted", "x")).toBe(SAMPLE_CV);
    expect(setCvText(SAMPLE_CV, "constructor.prototype", "x")).toBe(SAMPLE_CV);
    expect(setCvText(SAMPLE_CV, "experience.99.role", "x")).toBe(SAMPLE_CV);
    expect(setCvText(SAMPLE_CV, "experience", "x")).toBe(SAMPLE_CV);
    expect(setCvText(SAMPLE_CV, "nope", "x")).toBe(SAMPLE_CV);
    expect(setCvText(SAMPLE_CV, "", "x")).toBe(SAMPLE_CV);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("rejects values that break the schema limits", () => {
    expect(setCvText(SAMPLE_CV, "name", "x".repeat(500))).toBe(SAMPLE_CV);
  });

  it("trims the value", () => {
    expect(setCvText(SAMPLE_CV, "name", "  Tereza N.  ").name).toBe("Tereza N.");
  });
});
