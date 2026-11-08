import { connection } from "next/server";
import { jsonError } from "@/lib/http";
import { appOrigin, createCheckout, isPaywallEnabled, PRICE_CZK } from "@/lib/payments/checkout";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

/** Tells the client whether PDF export is paid (read at runtime, not at build). */
export async function GET() {
  await connection();
  return Response.json(
    {
      enabled: isPaywallEnabled(),
      priceCzk: PRICE_CZK,
      testMode: (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_"),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!isPaywallEnabled()) return jsonError("Platby nejsou zapnuté.", 404);
  if (!limiter(clientKey(request)).ok) return jsonError("Moc pokusů za sebou. Zkus to prosím za chvíli.", 429);
  try {
    const url = await createCheckout(appOrigin(request));
    return Response.json({ url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Stripe checkout failed:", error instanceof Error ? error.name : typeof error);
    return jsonError("Platbu se nepodařilo spustit. Zkus to prosím znovu.", 502);
  }
}
