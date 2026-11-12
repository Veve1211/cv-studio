import { describe, expect, it } from "vitest";
import { DEFAULT_TEMPLATE, getTemplate, isTemplateId, TEMPLATES } from "./index";

describe("template registry", () => {
  it("has the eight templates, the new ones first", () => {
    expect(TEMPLATES.map((t) => t.name)).toEqual([
      "Aura",
      "Švýcar",
      "Bento",
      "Časopis",
      "Časová osa",
      "Minimal",
      "Blok",
      "Terminál",
    ]);
  });
  it("falls back to the first template for unknown ids", () => {
    expect(getTemplate(DEFAULT_TEMPLATE).id).toBe("aura");
    // @ts-expect-error unknown id on purpose
    expect(getTemplate("nope").id).toBe("aura");
    expect(isTemplateId("block")).toBe(true);
    expect(isTemplateId("x")).toBe(false);
  });
});
