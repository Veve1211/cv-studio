import { accessCode, accessCookie, accessUntil, getPlan, planUntil, trialCookie, trialUsed } from "@/lib/access";
import { jsonError } from "@/lib/http";
import { isPaywallEnabled } from "@/lib/payments/checkout";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

/** One free day, once per browser. */
export async function POST(request: Request) {
  if (!isPaywallEnabled()) return jsonError("Platby nejsou zapnuté.", 404);
  if (accessUntil(request)) return jsonError("Plný přístup už máš.", 409);
  if (trialUsed(request)) return jsonError("Den zdarma už jsi v tomto prohlížeči využil(a).", 409);
  if (!limiter(clientKey(request)).ok) return jsonError("Moc pokusů za sebou. Zkus to prosím později.", 429);
  const until = planUntil(getPlan("trial")!, Math.floor(Date.now() / 1000));
  const headers = new Headers({ "Cache-Control": "no-store" });
  headers.append("Set-Cookie", accessCookie(request, until));
  headers.append("Set-Cookie", trialCookie(request));
  return Response.json({ until, code: accessCode(until) }, { headers });
}
