import { z } from "zod";
import { accessCode, accessCookie, parseAccessCode } from "@/lib/access";
import { jsonError, readJson } from "@/lib/http";
import { isPaywallEnabled } from "@/lib/payments/checkout";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

// Codes are signed; the limit makes guessing hopeless.
const limiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });
const BodySchema = z.object({ code: z.string().max(40) });

/** "Mám kód": unlocks this browser with the code from another device. */
export async function POST(request: Request) {
  if (!isPaywallEnabled()) return jsonError("Platby nejsou zapnuté.", 404);
  if (!limiter(clientKey(request)).ok) return jsonError("Moc pokusů za sebou. Zkus to prosím za chvíli.", 429);
  const body = await readJson(request);
  const parsed = body === null ? null : BodySchema.safeParse(body);
  if (!parsed?.success) return jsonError("Neplatný požadavek.", 400);
  const until = parseAccessCode(parsed.data.code);
  if (!until) return jsonError("Tenhle kód neplatí nebo už vypršel. Zkontroluj ho prosím.", 400);
  const headers = new Headers({ "Cache-Control": "no-store" });
  headers.append("Set-Cookie", accessCookie(request, until));
  return Response.json({ until, code: accessCode(until) }, { headers });
}
