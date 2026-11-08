import { z } from "zod";
import { CvError } from "@/lib/cv/generate";
import { CvSchema } from "@/lib/cv/schema";
import { improveSummary } from "@/lib/cv/summary";
import { jsonError, readJson } from "@/lib/http";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ limit: 20, windowMs: 15 * 60 * 1000 });
const BodySchema = z.object({ cv: CvSchema });

export async function POST(request: Request) {
  const body = await readJson(request);
  const parsed = body === null ? null : BodySchema.safeParse(body);
  if (!parsed?.success) return jsonError("Neplatný požadavek.", 400);

  const cv = parsed.data.cv;
  if (cv.experience.length === 0 && cv.education.length === 0 && cv.skills.length === 0 && !cv.headline) {
    return jsonError("V životopise je zatím málo údajů na nové shrnutí.", 422);
  }

  const rate = limiter(clientKey(request));
  if (!rate.ok) {
    return jsonError("Moc pokusů za sebou. Zkus to prosím za chvíli znovu.", 429, {
      "Retry-After": String(rate.retryAfterSec),
    });
  }

  try {
    const summary = await improveSummary(cv);
    return Response.json({ summary }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof CvError) return jsonError(error.message, error.status);
    return jsonError("Něco se pokazilo. Zkus to prosím znovu.", 500);
  }
}
