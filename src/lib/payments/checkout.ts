import Stripe from "stripe";
import type { Plan } from "@/lib/access";

const PRODUCT_TAG = "cv-access";
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{1,200}$/;

/** E2E-only fake: lets Playwright exercise the paid flow without calling Stripe. */
export const MOCK_KEY = "sk_test_mock";
export const MOCK_SESSION_PREFIX = "cs_test_mock";

export function isPaywallEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function isMock(): boolean {
  return process.env.E2E_MOCK_AI === "1" && process.env.STRIPE_SECRET_KEY === MOCK_KEY;
}

/** Narrow surface of the Stripe SDK we use (tests inject a fake). */
export interface CheckoutClient {
  checkout: {
    sessions: {
      create(params: Stripe.Checkout.SessionCreateParams): Promise<{ url: string | null }>;
      retrieve(id: string): Promise<{ payment_status: string; metadata: Record<string, string> | null; created?: number }>;
    };
  };
}

let client: CheckoutClient | null = null;
function getClient(): CheckoutClient {
  // Created lazily so builds work without the key.
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY ?? "") as unknown as CheckoutClient;
  return client;
}

/** One-off Stripe Checkout payment for a time-limited plan (no subscription). */
export async function createCheckout(origin: string, plan: Plan, stripe?: CheckoutClient): Promise<string> {
  if (!stripe && isMock()) return `${origin}/?checkout=success&session_id=${MOCK_SESSION_PREFIX}${plan.id}`;
  const session = await (stripe ?? getClient()).checkout.sessions.create({
    mode: "payment",
    locale: "cs",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "czk",
          unit_amount: plan.priceCzk * 100,
          product_data: {
            name: `Cvéčko – plný přístup na ${plan.name}`,
            description: "PDF bez vodoznaku, motivační dopis, přizpůsobení inzerátu a angličtina. Jednorázově, bez automatického obnovení.",
          },
        },
      },
    ],
    metadata: { product: PRODUCT_TAG, plan: plan.id },
    success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?checkout=cancel`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

/** A paid session of our product: which plan and when it was paid (unix s). */
export async function verifyCheckout(
  sessionId: string,
  stripe?: CheckoutClient,
): Promise<{ plan: string; created: number } | null> {
  if (!SESSION_ID.test(sessionId)) return null;
  if (!stripe && isMock()) {
    const plan = sessionId.startsWith(MOCK_SESSION_PREFIX) ? sessionId.slice(MOCK_SESSION_PREFIX.length) : "";
    return plan === "14d" || plan === "year" ? { plan, created: Math.floor(Date.now() / 1000) } : null;
  }
  try {
    const session = await (stripe ?? getClient()).checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" || session.metadata?.product !== PRODUCT_TAG) return null;
    return { plan: session.metadata.plan ?? "", created: session.created ?? Math.floor(Date.now() / 1000) };
  } catch {
    return null;
  }
}

/**
 * Origin for Stripe return URLs. APP_URL wins (set it in production so a forged
 * Host header can never redirect customers elsewhere); otherwise the request origin.
 */
export function appOrigin(request: Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured && /^https?:\/\/[^/\s]+$/.test(configured.replace(/\/$/, ""))) {
    return configured.replace(/\/$/, "");
  }
  return new URL(request.url).origin;
}
