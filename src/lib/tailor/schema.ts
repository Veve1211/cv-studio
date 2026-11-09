import { z } from "zod";

/** What the AI may change: only the ORDER of existing items and the summary wording. */
export const TailorSchema = z.object({
  /** Original experience indices, most relevant first. */
  experienceOrder: z.array(z.number().int().min(0).max(99)).max(100),
  /** For each ORIGINAL experience index: its highlight indices, most relevant first. */
  highlightOrder: z.array(z.array(z.number().int().min(0).max(99)).max(100)).max(100),
  /** Original skill indices, most relevant first. */
  skillsOrder: z.array(z.number().int().min(0).max(199)).max(200),
  /** Summary rewritten for the position, only from facts in the CV. */
  summary: z.string().trim().max(1200),
  /** What the ad asks for; evidence = short exact quote from the CV, or "" when missing. */
  requirements: z
    .array(z.object({ text: z.string().trim().min(1).max(120), evidence: z.string().trim().max(200) }))
    .max(12),
});

export type Tailor = z.infer<typeof TailorSchema>;

const int = { type: "integer" } as const;
const str = { type: "string" } as const;
export const TAILOR_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["experienceOrder", "highlightOrder", "skillsOrder", "summary", "requirements"],
  properties: {
    experienceOrder: { type: "array", items: int },
    highlightOrder: { type: "array", items: { type: "array", items: int } },
    skillsOrder: { type: "array", items: int },
    summary: str,
    requirements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "evidence"],
        properties: { text: str, evidence: str },
      },
    },
  },
} as const;
