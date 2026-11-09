import { z } from "zod";
import { CvError } from "@/lib/cv/generate";
import { CvSchema } from "@/lib/cv/schema";
import { firstIssue, jsonError, readJson } from "@/lib/http";
import { requireAccess } from "@/lib/require-access";
import { generateLetter } from "@/lib/letter/generate";
import { MAX_JOB_CHARS, MIN_JOB_CHARS } from "@/lib/letter/schema";
import { createAiLimit } from "@/lib/ai-limit";

const limit = createAiLimit("letter", 10);

const BodySchema = z.object({
  cv: CvSchema,
  job: z
    .string({ error: "Chybí text inzerátu." })
    .trim()
    .min(MIN_JOB_CHARS, { error: "Vlož prosím celý text inzerátu (aspoň pár vět)." })
    .max(MAX_JOB_CHARS, { error: `Inzerát je moc dlouhý (max ${MAX_JOB_CHARS.toLocaleString("cs-CZ")} znaků).` }),
});

/** Cover letter from the CV + job ad. Nothing is stored or logged. */
export async function POST(request: Request) {
  const body = await readJson(request, 96_000);
  if (body === null) return jsonError("Neplatný požadavek.", 400);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return jsonError(firstIssue(parsed.error), 400);

  const locked = requireAccess(request);
  if (locked) return locked;

  const rate = limit(request);
  if (rate.error) return rate.error;

  try {
    const letter = await generateLetter(parsed.data.cv, parsed.data.job);
    const headers = new Headers({ "Cache-Control": "no-store" });
    if (rate.setCookie) headers.append("Set-Cookie", rate.setCookie);
    return Response.json({ letter }, { headers });
  } catch (error) {
    if (error instanceof CvError) return jsonError(error.message, error.status);
    return jsonError("Něco se pokazilo. Zkus to prosím znovu.", 500);
  }
}
