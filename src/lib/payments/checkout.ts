import Stripe from "stripe";

export const PRICE_CZK = 99;
export const PAID_VALID_DAYS = 30;
const PRODUCT_TAG = "cv-pdf";
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{1,200}$/;

/** E2E-only fake: lets Playwright exercise the paid flow without calling Stripe. */
export const MOCK_KEY = "sk_test_mock";
export const MOCK_SESSION_ID = "cs_test_mock";

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

/** Creates a one-off Stripe Checkout session for the PDF and returns its URL. */
export async function createCheckout(origin: string, stripe?: CheckoutClient): Promise<string> {
  if (!stripe && isMock()) return `${origin}/?checkout=success&session_id=${MOCK_SESSION_ID}`;
  const session = await (stripe ?? getClient()).checkout.sessions.create({
    mode: "payment",
    locale: "cs",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "czk",
          unit_amount: PRICE_CZK * 100,
          product_data: { name: "Životopis v PDF", description: "Jednorázové stažení životopisu z Cvéčka" },
        },
      },
    ],
    metadata: { product: PRODUCT_TAG },
    success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?checkout=cancel`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

/** True only for a real, paid session of our product. */
export async function verifyCheckout(sessionId: string, stripe?: CheckoutClient): Promise<boolean> {
  if (!SESSION_ID.test(sessionId)) return false;
  if (!stripe && isMock()) return sessionId === MOCK_SESSION_ID;
  try {
    const session = await (stripe ?? getClient()).checkout.sessions.retrieve(sessionId);
    // One payment unlocks downloads (also after edits) for 30 days.
    const fresh = session.created === undefined || Date.now() / 1000 - session.created < PAID_VALID_DAYS * 86_400;
    return session.payment_status === "paid" && session.metadata?.product === PRODUCT_TAG && fresh;
  } catch {
    return false;
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
