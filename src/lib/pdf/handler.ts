import { z } from "zod";
import { jsonError, readJson } from "@/lib/http";
import { isPaywallEnabled, verifyCheckout } from "@/lib/payments/checkout";
import { pdfFileTitle } from "@/lib/pdf";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";
import { PrintDataSchema, type PrintData } from "./print-data";

const BodySchema = PrintDataSchema.extend({ sessionId: z.string().max(256) });

interface Deps {
  verify: (sessionId: string) => Promise<boolean>;
  render: (data: PrintData) => Promise<Uint8Array>;
}

/**
 * Paid PDF download: only after Stripe confirms the session is paid, rendered on the
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

    const { sessionId, ...data } = parsed.data;
    if (!(await deps.verify(sessionId))) return jsonError("PDF je dostupné až po zaplacení.", 402);

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

export const verifyPaid = verifyCheckout;
