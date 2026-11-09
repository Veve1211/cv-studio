import { describe, expect, it, vi } from "vitest";
import type { MessagesClient } from "@/lib/cv/generate";
import { SAMPLE_CV } from "@/lib/cv/sample";
import { generateLetter, LETTER_SYSTEM_PROMPT, MOCK_LETTER } from "./generate";
import { LETTER_JSON_SCHEMA, LetterSchema } from "./schema";

const fake = (payload: unknown) => {
  const create = vi.fn().mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(payload) }] });
  return { client: { beta: { messages: { create } } } as MessagesClient, create };
};

describe("generateLetter", () => {
  it("sends the CV and the job ad and returns a validated letter", async () => {
    const { client, create } = fake(MOCK_LETTER);
    const job = "Hledáme produktovou designérku do týmu v Brně, Figma nutností.";
    await expect(generateLetter(SAMPLE_CV, job, client)).resolves.toEqual(MOCK_LETTER);
    const params = create.mock.calls[0][0];
    expect(params.system).toBe(LETTER_SYSTEM_PROMPT);
    expect(params.output_config.format.schema).toEqual(LETTER_JSON_SCHEMA);
    expect(params.messages[0].content).toContain("Kvetoucí s.r.o.");
    expect(params.messages[0].content).toContain("Figma nutností");
  });

  it("rejects letters without paragraphs", async () => {
    const { client } = fake({ ...MOCK_LETTER, paragraphs: [] });
    await expect(generateLetter(SAMPLE_CV, "x".repeat(40), client)).rejects.toMatchObject({ status: 502 });
  });

  it("prompt forbids inventing facts about the candidate", () => {
    expect(LETTER_SYSTEM_PROMPT).toContain("Nic nepřidávej");
    expect(LetterSchema.safeParse(MOCK_LETTER).success).toBe(true);
  });
});
