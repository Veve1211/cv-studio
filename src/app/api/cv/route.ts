import { CvError, generateCv } from "@/lib/cv/generate";
import { GenerateRequestSchema } from "@/lib/cv/schema";
import { firstIssue, jsonError, readJson } from "@/lib/http";
import { createAiLimit } from "@/lib/ai-limit";

// Each call costs money: at most 10 CVs per visitor per 15 minutes.
const limit = createAiLimit("cv", 10);

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) return jsonError("Neplatný požadavek.", 400);

  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstIssue(parsed.error), 400);

  const rate = limit(request);
  if (rate.error) return rate.error;

  try {
    const cv = await generateCv(parsed.data.text);
    const headers = new Headers({ "Cache-Control": "no-store" });
    if (rate.setCookie) headers.append("Set-Cookie", rate.setCookie);
    return Response.json({ cv }, { headers });
  } catch (error) {
    if (error instanceof CvError) return jsonError(error.message, error.status);
    return jsonError("Něco se pokazilo. Zkus to prosím znovu.", 500);
  }
}
