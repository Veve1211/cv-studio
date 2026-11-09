import { z } from "zod";

// Our strict CSP forbids eval: tell zod not to probe `new Function` (it would only log
// a CSP violation and fall back anyway).
z.config({ jitless: true });

/** Trimmed string with a generous upper bound (guards against runaway output). */
const text = (max: number) => z.string().trim().max(max);

export const ContactSchema = z.object({
  email: text(200),
  phone: text(60),
  location: text(120),
  web: text(300),
});

export const ExperienceSchema = z.object({
  company: text(200),
  role: text(200),
  period: text(80),
  highlights: z.array(text(400)).max(8),
});

export const EducationSchema = z.object({
  school: text(200),
  degree: text(200),
  period: text(80),
});

export const LanguageSchema = z.object({
  language: text(60),
  level: text(60),
});

export const CvSchema = z.object({
  name: text(120),
  headline: text(200),
  contact: ContactSchema,
  summary: text(1200),
  experience: z.array(ExperienceSchema).max(20),
  education: z.array(EducationSchema).max(12),
  skills: z.array(text(80)).max(40),
  languages: z.array(LanguageSchema).max(12),
});

export type Cv = z.infer<typeof CvSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;

/** Input the user sends: free text about themselves. */
export const MIN_INPUT_CHARS = 20;
export const MAX_INPUT_CHARS = 15_000;

export const GenerateRequestSchema = z.object({
  text: z
    .string({ error: "Chybí text o tobě." })
    .trim()
    .min(MIN_INPUT_CHARS, { error: "Napiš o sobě prosím aspoň pár vět." })
    .max(MAX_INPUT_CHARS, { error: `Text je moc dlouhý (max ${MAX_INPUT_CHARS.toLocaleString("cs-CZ")} znaků).` }),
});

/**
 * JSON Schema sent to Claude's structured outputs. Hand-written (not derived from zod)
 * because structured outputs reject some constraints such as maxLength.
 * Every object has additionalProperties: false and lists all keys as required.
 */
const str = { type: "string" } as const;
const strArr = { type: "array", items: str } as const;

function obj(properties: Record<string, unknown>) {
  return {
    type: "object",
    additionalProperties: false,
    required: Object.keys(properties),
    properties,
  } as const;
}

export const CV_JSON_SCHEMA = obj({
  name: str,
  headline: str,
  contact: obj({ email: str, phone: str, location: str, web: str }),
  summary: str,
  experience: { type: "array", items: obj({ company: str, role: str, period: str, highlights: strArr }) },
  education: { type: "array", items: obj({ school: str, degree: str, period: str }) },
  skills: strArr,
  languages: { type: "array", items: obj({ language: str, level: str }) },
});

export const EMPTY_CV: Cv = {
  name: "",
  headline: "",
  contact: { email: "", phone: "", location: "", web: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  languages: [],
};
