import { CvError, generateCv } from "@/lib/cv/generate";
import { GenerateRequestSchema } from "@/lib/cv/schema";
import { firstIssue, jsonError, readJson } from "@/lib/http";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";
import { cookieLimit } from "@/lib/rate-limit-cookie";

// Each call costs money: at most 10 CVs per visitor per 15 minutes.
const limiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) return jsonError("Neplatný požadavek.", 400);

  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstIssue(parsed.error), 400);

  const rate = limiter(clientKey(request));
  if (!rate.ok) {
    return jsonError("Moc pokusů za sebou. Zkus to prosím za chvíli znovu.", 429, {
      "Retry-After": String(rate.retryAfterSec),
    });
  }

  // Survives restarts: the count also lives in a signed HttpOnly cookie.
  const cookie = cookieLimit(request, { scope: "cv", limit: 10, windowSec: 15 * 60 });
  if (!cookie.ok) {
    return jsonError("Moc pokusů za sebou. Zkus to prosím za chvíli znovu.", 429, {
      "Retry-After": String(cookie.retryAfterSec),
    });
  }

  try {
    const cv = await generateCv(parsed.data.text);
    const headers = new Headers({ "Cache-Control": "no-store" });
    if (cookie.setCookie) headers.append("Set-Cookie", cookie.setCookie);
    return Response.json({ cv }, { headers });
  } catch (error) {
    if (error instanceof CvError) return jsonError(error.message, error.status);
    return jsonError("Něco se pokazilo. Zkus to prosím znovu.", 500);
  }
}
