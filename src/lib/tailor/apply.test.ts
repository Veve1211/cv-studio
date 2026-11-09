import { describe, expect, it } from "vitest";
import { SAMPLE_CV } from "@/lib/cv/sample";
import { applyTailor, safeOrder } from "./apply";
import { mockTailor } from "./generate";
import { TailorSchema } from "./schema";

describe("safeOrder", () => {
  it("keeps a valid permutation", () => {
    expect(safeOrder([2, 0, 1], 3)).toEqual([2, 0, 1]);
  });
  it("drops duplicates and out-of-range indices and appends forgotten ones", () => {
    expect(safeOrder([1, 1, 7, -1, 2.5], 3)).toEqual([1, 0, 2]);
    expect(safeOrder([], 2)).toEqual([0, 1]);
  });
});

describe("applyTailor", () => {
  it("only reorders: no value is added, removed or changed", () => {
    const t = mockTailor(SAMPLE_CV);
    const { cv } = applyTailor(SAMPLE_CV, { ...t, summary: SAMPLE_CV.summary });
    expect(cv.experience.map((e) => e.company)).toEqual(SAMPLE_CV.experience.map((e) => e.company).reverse());
    expect([...cv.skills].sort()).toEqual([...SAMPLE_CV.skills].sort());
    const allHighlights = (c: typeof cv) => c.experience.flatMap((e) => e.highlights).sort();
    expect(allHighlights(cv)).toEqual(allHighlights(SAMPLE_CV));
    expect(cv.education).toEqual(SAMPLE_CV.education);
    expect(cv.languages).toEqual(SAMPLE_CV.languages);
    expect(cv.name).toBe(SAMPLE_CV.name);
  });

  it("survives a broken AI answer (missing or bogus indices)", () => {
    const { cv } = applyTailor(SAMPLE_CV, {
      experienceOrder: [9, 9],
      highlightOrder: [],
      skillsOrder: [0, 0, 0],
      summary: "",
      requirements: [],
    });
    expect(cv.experience).toEqual(SAMPLE_CV.experience);
    expect(cv.skills).toEqual(SAMPLE_CV.skills);
    expect(cv.summary).toBe(SAMPLE_CV.summary);
  });

  it("maps edited paths to their new place", () => {
    const { remap, cv } = applyTailor(SAMPLE_CV, mockTailor(SAMPLE_CV));
    const last = SAMPLE_CV.experience.length - 1;
    expect(remap("experience.0.role")).toBe(`experience.${last}.role`);
    expect(cv.experience[last].role).toBe(SAMPLE_CV.experience[0].role);
    const h = SAMPLE_CV.experience[0].highlights.length - 1;
    expect(remap("experience.0.highlights.0")).toBe(`experience.${last}.highlights.${h}`);
    expect(remap("name")).toBe("name");
  });

  it("says 'máš' only when the evidence is really in the CV", () => {
    const { analysis } = applyTailor(SAMPLE_CV, {
      ...mockTailor(SAMPLE_CV),
      requirements: [
        { text: "Figma", evidence: "figma" },
        { text: "SAP", evidence: "SAP HANA certifikát" },
        { text: "Řidičák", evidence: "" },
      ],
    });
    expect(analysis.wants).toEqual(["Figma", "SAP", "Řidičák"]);
    expect(analysis.have).toEqual(["Figma"]);
    expect(analysis.missing).toEqual(["SAP", "Řidičák"]);
  });

  it("the mock answer is valid", () => {
    expect(TailorSchema.safeParse(mockTailor(SAMPLE_CV)).success).toBe(true);
  });
});
