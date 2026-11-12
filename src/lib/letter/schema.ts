import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);

/** The letter body; name and contacts come from the CV. */
export const LetterSchema = z.object({
  /** e.g. "Kvetoucí s.r.o. – Senior produktová designérka" (from the job ad, may be empty) */
  recipient: text(200),
  greeting: text(120),
  paragraphs: z.array(text(1500)).min(1).max(6),
  closing: text(120),
});

export type Letter = z.infer<typeof LetterSchema>;

/** What the app keeps and prints: the AI letter plus a place/date line set once on creation. */
export const LetterDocSchema = LetterSchema.extend({ dateLine: text(120) });
export type LetterDoc = z.infer<typeof LetterDocSchema>;

/** "V Brně 9. 11. 2026" (no declension guessing: "Brno, 9. 11. 2026"). */
export function letterDateLine(location: string, date = new Date()): string {
  const d = `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
  return location.trim() ? `${location.trim()}, ${d}` : d;
}

export const MIN_JOB_CHARS = 30;
export const MAX_JOB_CHARS = 10_000;

const str = { type: "string" } as const;
export const LETTER_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["recipient", "greeting", "paragraphs", "closing"],
  properties: { recipient: str, greeting: str, paragraphs: { type: "array", items: str }, closing: str },
} as const;
