import { describe, expect, it } from "vitest";
import { DEFAULT_TEMPLATE, getTemplate, isTemplateId, TEMPLATES } from "./index";

describe("template registry", () => {
  it("has the five templates in order", () => {
    expect(TEMPLATES.map((t) => t.name)).toEqual(["Časopis", "Časová osa", "Minimal", "Blok", "Terminál"]);
  });
  it("falls back to the first template for unknown ids", () => {
    expect(getTemplate(DEFAULT_TEMPLATE).id).toBe("magazine");
    // @ts-expect-error unknown id on purpose
    expect(getTemplate("nope").id).toBe("magazine");
    expect(isTemplateId("block")).toBe(true);
    expect(isTemplateId("x")).toBe(false);
  });
});
