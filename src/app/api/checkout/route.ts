import { connection } from "next/server";
import { z } from "zod";
import { accessCode, accessUntil, getPlan, plans, trialUsed } from "@/lib/access";
import { demoUntil } from "@/lib/demo";
import { jsonError, readJson } from "@/lib/http";
import { appOrigin, createCheckout, isPaywallEnabled } from "@/lib/payments/checkout";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

/**
 * Access state for this browser (read at runtime, not at build).
 * Presentation mode (signed cookie) unlocks everything in that browser.
 */
export async function GET(request: Request) {
  await connection();
  const demo = demoUntil(request);
  const until = accessUntil(request);
  return Response.json(
    {
      enabled: isPaywallEnabled() && demo === null,
      demoUntil: demo,
      testMode: (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_"),
      plans: isPaywallEnabled() ? plans() : [],
      trialUsed: trialUsed(request),
      access: until ? { until, code: accessCode(until) } : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

const BodySchema = z.object({
  plan: z.enum(["14d", "year"]),
  // Czech consumer law: agreement with the terms and with starting the service right away.
  terms: z.literal(true, { error: "Potvrď prosím souhlas s obchodními podmínkami." }),
  startNow: z.literal(true, { error: "Potvrď prosím souhlas se zahájením plnění." }),
});

export async function POST(request: Request) {
  if (!isPaywallEnabled()) return jsonError("Platby nejsou zapnuté.", 404);
  if (!limiter(clientKey(request)).ok) return jsonError("Moc pokusů za sebou. Zkus to prosím za chvíli.", 429);
  const body = await readJson(request);
  const parsed = body === null ? null : BodySchema.safeParse(body);
  if (!parsed?.success) return jsonError(parsed?.error.issues[0]?.message ?? "Neplatný požadavek.", 400);
  const plan = getPlan(parsed.data.plan);
  if (!plan) return jsonError("Neznámý tarif.", 400);
  try {
    const url = await createCheckout(appOrigin(request), plan);
    return Response.json({ url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Stripe checkout failed:", error instanceof Error ? error.name : typeof error);
    return jsonError("Platbu se nepodařilo spustit. Zkus to prosím znovu.", 502);
  }
}
