import { z } from "zod";
import { CvError } from "@/lib/cv/generate";
import { CvSchema } from "@/lib/cv/schema";
import { firstIssue, jsonError, readJson } from "@/lib/http";
import { generateLetter } from "@/lib/letter/generate";
import { MAX_JOB_CHARS, MIN_JOB_CHARS } from "@/lib/letter/schema";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";
import { cookieLimit } from "@/lib/rate-limit-cookie";

const limiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

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

  if (!limiter(clientKey(request)).ok) return jsonError("Moc pokusů za sebou. Zkus to prosím za chvíli znovu.", 429);

  // Survives restarts: the count also lives in a signed HttpOnly cookie.
  const cookie = cookieLimit(request, { scope: "letter", limit: 10, windowSec: 15 * 60 });
  if (!cookie.ok) {
    return jsonError("Moc pokusů za sebou. Zkus to prosím za chvíli znovu.", 429, {
      "Retry-After": String(cookie.retryAfterSec),
    });
  }

  try {
    const letter = await generateLetter(parsed.data.cv, parsed.data.job);
    const headers = new Headers({ "Cache-Control": "no-store" });
    if (cookie.setCookie) headers.append("Set-Cookie", cookie.setCookie);
    return Response.json({ letter }, { headers });
  } catch (error) {
    if (error instanceof CvError) return jsonError(error.message, error.status);
    return jsonError("Něco se pokazilo. Zkus to prosím znovu.", 500);
  }
}
