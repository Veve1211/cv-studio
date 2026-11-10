import { createHash, timingSafeEqual } from "node:crypto";
import { SAMPLE_CV } from "@/lib/cv/sample";
import type { PrintData } from "@/lib/pdf/print-data";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

export const SMOKE_HEADER = "x-smoke-token";

interface Deps {
  render: (data: PrintData) => Promise<Uint8Array>;
}

/** Deployed commit: Railway sets RAILWAY_GIT_COMMIT_SHA at runtime. */
export function appVersion(): string {
  return process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || "unknown";
}

function sameToken(given: string, expected: string): boolean {
  // Hash both so the comparison is constant-time regardless of length.
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Health check for the post-deploy smoke test. Without the secret header it only says
 * "up" and which commit runs. With x-smoke-token = SMOKE_TOKEN it also renders a small
 * PDF of the fictional sample CV in headless Chromium. Chromium never starts otherwise.
 * No AI, no user data.
 */
export function createHealthHandler(deps: Deps) {
  const limiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

  return async function GET(request: Request): Promise<Response> {
    const headers = { "Cache-Control": "no-store" };
    const base = { status: "ok", version: appVersion() };
    const given = request.headers.get(SMOKE_HEADER);
    if (given === null) return Response.json(base, { headers });

    const expected = process.env.SMOKE_TOKEN ?? "";
    if (!expected || !sameToken(given, expected)) {
      return Response.json({ ...base, error: "invalid smoke token" }, { status: 401, headers });
    }
    if (!limiter(clientKey(request)).ok) {
      return Response.json({ ...base, error: "too many checks" }, { status: 429, headers });
    }

    const started = Date.now();
    try {
      const pdf = await deps.render({ cv: SAMPLE_CV, templateId: "aura", accentId: "sky" });
      const isPdf = pdf.length > 1000 && Buffer.from(pdf.subarray(0, 5)).toString("latin1") === "%PDF-";
      if (!isPdf) throw new Error("output is not a PDF");
      return Response.json({ ...base, pdf: { ok: true, bytes: pdf.length, ms: Date.now() - started } }, { headers });
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 300) : typeof error;
      console.error("Smoke PDF failed:", message);
      return Response.json(
        { ...base, status: "degraded", pdf: { ok: false, error: message, ms: Date.now() - started } },
        { status: 503, headers },
      );
    }
  };
}
