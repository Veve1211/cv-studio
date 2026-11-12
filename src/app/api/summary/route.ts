import { z } from "zod";
import { CvError } from "@/lib/cv/generate";
import { CvSchema } from "@/lib/cv/schema";
import { improveSummary } from "@/lib/cv/summary";
import { jsonError, readJson } from "@/lib/http";
import { createAiLimit } from "@/lib/ai-limit";

const limit = createAiLimit("summary", 20);
const BodySchema = z.object({ cv: CvSchema });

export async function POST(request: Request) {
  const body = await readJson(request);
  const parsed = body === null ? null : BodySchema.safeParse(body);
  if (!parsed?.success) return jsonError("Neplatný požadavek.", 400);

  const cv = parsed.data.cv;
  if (cv.experience.length === 0 && cv.education.length === 0 && cv.skills.length === 0 && !cv.headline) {
    return jsonError("V životopise je zatím málo údajů na nové shrnutí.", 422);
  }

  const rate = limit(request);
  if (rate.error) return rate.error;

  try {
    const summary = await improveSummary(cv);
    const headers = new Headers({ "Cache-Control": "no-store" });
    if (rate.setCookie) headers.append("Set-Cookie", rate.setCookie);
    return Response.json({ summary }, { headers });
  } catch (error) {
    if (error instanceof CvError) return jsonError(error.message, error.status);
    return jsonError("Něco se pokazilo. Zkus to prosím znovu.", 500);
  }
}
