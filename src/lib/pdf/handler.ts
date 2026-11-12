import { jsonError, readJson } from "@/lib/http";
import { hasFullAccess } from "@/lib/access";
import { isPaywallEnabled } from "@/lib/payments/checkout";
import { pdfFileTitle } from "@/lib/pdf";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";
import { PrintDataSchema, type PrintData } from "./print-data";

const BodySchema = PrintDataSchema;

interface Deps {
  /** Paid access of this browser (signed cookie), presentation mode included. */
  verify: (request: Request) => boolean;
  render: (data: PrintData) => Promise<Uint8Array>;
}

/**
 * Paid PDF download: only with full access (checked here, on the server), rendered on the
 * server (clean, no watermark). Nothing is stored; the CV only lives in this request.
 */
export function createPdfHandler(deps: Deps) {
  const limiter = createRateLimiter({ limit: 20, windowMs: 15 * 60 * 1000 });

  return async function POST(request: Request): Promise<Response> {
    if (!isPaywallEnabled()) return jsonError("PDF se stahuje přes tisk prohlížeče.", 404);
    if (!limiter(clientKey(request)).ok) return jsonError("Moc pokusů za sebou. Zkus to prosím za chvíli.", 429);

    const body = await readJson(request);
    const parsed = body === null ? null : BodySchema.safeParse(body);
    if (!parsed?.success) return jsonError("Neplatný požadavek.", 400);

    const data = parsed.data;
    if (!deps.verify(request)) return jsonError("PDF bez vodoznaku je součástí plného přístupu.", 402);

    try {
      const pdf = await deps.render(data);
      return new Response(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${pdfFileTitle(data.cv.name, data.letter ? "Motivacni-dopis" : "Zivotopis")}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      console.error("PDF rendering failed:", error instanceof Error ? error.message.slice(0, 200) : typeof error);
      return jsonError("PDF se teď nepodařilo vytvořit. Zkus to prosím za chvíli znovu.", 503);
    }
  };
}

export const verifyPaid = hasFullAccess;
