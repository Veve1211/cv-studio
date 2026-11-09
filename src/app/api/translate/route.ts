import { z } from "zod";
import { createAiLimit } from "@/lib/ai-limit";
import { CvError } from "@/lib/cv/generate";
import { CvSchema } from "@/lib/cv/schema";
import { jsonError, readJson } from "@/lib/http";
import { LetterSchema } from "@/lib/letter/schema";
import { translateToEnglish } from "@/lib/translate/translate";

const limit = createAiLimit("translate", 10);
const BodySchema = z.object({ cv: CvSchema, letter: LetterSchema.nullable().optional() });

/** English version of the CV (+ letter). Nothing is stored or logged. */
export async function POST(request: Request) {
  const body = await readJson(request, 128_000);
  const parsed = body === null ? null : BodySchema.safeParse(body);
  if (!parsed?.success) return jsonError("Neplatný požadavek.", 400);

  const rate = limit(request);
  if (rate.error) return rate.error;

  try {
    const result = await translateToEnglish(parsed.data.cv, parsed.data.letter ?? null);
    const headers = new Headers({ "Cache-Control": "no-store" });
    if (rate.setCookie) headers.append("Set-Cookie", rate.setCookie);
    return Response.json(result, { headers });
  } catch (error) {
    if (error instanceof CvError) return jsonError(error.message, error.status);
    return jsonError("Něco se pokazilo. Zkus to prosím znovu.", 500);
  }
}
