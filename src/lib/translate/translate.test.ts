import { describe, expect, it } from "vitest";
import { SAMPLE_CV } from "@/lib/cv/sample";
import { MOCK_LETTER } from "@/lib/letter/generate";
import { checkTranslation, lockUntranslatable, translateToEnglish } from "./translate";
import type { MessagesClient } from "@/lib/cv/generate";

const reply = (json: unknown): MessagesClient => ({
  beta: { messages: { create: async () => ({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(json) }] }) } },
});

describe("English translation", () => {
  it("never translates names, companies or contacts", () => {
    const en = structuredClone(SAMPLE_CV);
    en.name = "Teresa Novak";
    en.experience[0].company = "Blooming Ltd.";
    en.contact.location = "Brunn";
    const locked = lockUntranslatable(SAMPLE_CV, en);
    expect(locked.name).toBe(SAMPLE_CV.name);
    expect(locked.experience[0].company).toBe(SAMPLE_CV.experience[0].company);
    expect(locked.contact).toEqual(SAMPLE_CV.contact);
  });

  it("refuses a translation that dropped a job", () => {
    const en = { ...structuredClone(SAMPLE_CV), experience: SAMPLE_CV.experience.slice(1) };
    expect(() => lockUntranslatable(SAMPLE_CV, en)).toThrow();
  });

  it("flags numbers and years that differ from the Czech version", () => {
    const en = structuredClone(SAMPLE_CV);
    en.summary = "Designer with 9 years of experience since 2011.";
    expect(checkTranslation(en, SAMPLE_CV).get("summary")).toEqual(expect.arrayContaining(["2011", "9"]));
    expect(checkTranslation(structuredClone(SAMPLE_CV), SAMPLE_CV).size).toBe(0);
  });

  it("returns the letter only when one was sent", async () => {
    const enCv = structuredClone(SAMPLE_CV);
    const client = reply({ cv: enCv, letter: { ...MOCK_LETTER, greeting: "Dear team," } });
    const withLetter = await translateToEnglish(SAMPLE_CV, MOCK_LETTER, client);
    expect(withLetter.letter?.greeting).toBe("Dear team,");
    const without = await translateToEnglish(SAMPLE_CV, null, reply({ cv: enCv, letter: { recipient: "", greeting: "", paragraphs: [], closing: "" } }));
    expect(without.letter).toBeNull();
  });
});
