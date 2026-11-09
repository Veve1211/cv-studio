import { z } from "zod";
import { CvSchema } from "@/lib/cv/schema";
import { LetterDocSchema } from "@/lib/letter/schema";

export const TEMPLATE_IDS = ["aura", "swiss", "bento", "magazine", "timeline", "minimal", "block", "terminal"] as const;

/** Everything the print page needs; validated on the server and again in the page. */
export const PrintDataSchema = z.object({
  cv: CvSchema,
  templateId: z.enum(TEMPLATE_IDS),
  accentId: z.string().max(32),
  /** When present, the cover letter is printed instead of the CV. */
  letter: LetterDocSchema.optional(),
});

export type PrintData = z.infer<typeof PrintDataSchema>;

/** Name of the global the headless browser sets before the page scripts run. */
export const PRINT_GLOBAL = "__CVECKO_PRINT__";
