import { z } from "zod";
import { CvSchema } from "@/lib/cv/schema";

export const TEMPLATE_IDS = ["magazine", "timeline", "minimal", "block", "terminal"] as const;

/** Everything the print page needs; validated on the server and again in the page. */
export const PrintDataSchema = z.object({
  cv: CvSchema,
  templateId: z.enum(TEMPLATE_IDS),
  accentId: z.string().max(32),
});

export type PrintData = z.infer<typeof PrintDataSchema>;

/** Name of the global the headless browser sets before the page scripts run. */
export const PRINT_GLOBAL = "__CVECKO_PRINT__";
