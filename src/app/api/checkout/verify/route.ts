import { z } from "zod";
import { accessCode, accessCookie, getPlan, planUntil } from "@/lib/access";
import { jsonError, readJson } from "@/lib/http";
import { isPaywallEnabled, verifyCheckout } from "@/lib/payments/checkout";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ limit: 30, windowMs: 15 * 60 * 1000 });
const BodySchema = z.object({ sessionId: z.string().max(256) });

/** After Stripe: checks the payment there and unlocks this browser (signed cookie). */
export async function POST(request: Request) {
  if (!isPaywallEnabled()) return Response.json({ paid: true });
  if (!limiter(clientKey(request)).ok) return jsonError("Moc pokusů za sebou.", 429);
  const body = await readJson(request);
  const parsed = body === null ? null : BodySchema.safeParse(body);
  if (!parsed?.success) return jsonError("Neplatný požadavek.", 400);

  const session = await verifyCheckout(parsed.data.sessionId);
  const plan = session ? getPlan(session.plan) : null;
  const until = session && plan && plan.id !== "trial" ? planUntil(plan, session.created) : 0;
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (until <= Date.now() / 1000) return Response.json({ paid: false }, { headers });
  headers.append("Set-Cookie", accessCookie(request, until));
  return Response.json({ paid: true, until, code: accessCode(until) }, { headers });
}
