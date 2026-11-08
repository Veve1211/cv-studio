import { z } from "zod";
import { jsonError, readJson } from "@/lib/http";
import { isPaywallEnabled, verifyCheckout } from "@/lib/payments/checkout";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ limit: 30, windowMs: 15 * 60 * 1000 });
const BodySchema = z.object({ sessionId: z.string().max(256) });

export async function POST(request: Request) {
  if (!isPaywallEnabled()) return Response.json({ paid: true });
  if (!limiter(clientKey(request)).ok) return jsonError("Moc pokusů za sebou.", 429);
  const body = await readJson(request);
  const parsed = body === null ? null : BodySchema.safeParse(body);
  if (!parsed?.success) return jsonError("Neplatný požadavek.", 400);
  const paid = await verifyCheckout(parsed.data.sessionId);
  return Response.json({ paid }, { headers: { "Cache-Control": "no-store" } });
}
