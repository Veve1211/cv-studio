import { afterEach, describe, expect, it, vi } from "vitest";
import { getPlan } from "@/lib/access";
import { appOrigin, createCheckout, verifyCheckout, type CheckoutClient } from "./checkout";

function fakeStripe(overrides: Partial<CheckoutClient["checkout"]["sessions"]> = {}) {
  const create = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test_123" });
  const retrieve = vi.fn().mockResolvedValue({ payment_status: "paid", metadata: { product: "cv-access", plan: "14d" }, created: 1000 });
  const client = { checkout: { sessions: { create, retrieve, ...overrides } } } as CheckoutClient;
  return { client, create, retrieve };
}

afterEach(() => vi.unstubAllEnvs());

describe("createCheckout", () => {
  it("creates a one-off payment (no subscription) for the plan with return URLs", async () => {
    vi.stubEnv("PRICE_14D_CZK", "99");
    const { client, create } = fakeStripe();
    const url = await createCheckout("https://cvecko.example", getPlan("14d")!, client);
    expect(url).toContain("checkout.stripe.com");
    const params = create.mock.calls[0][0];
    expect(params.mode).toBe("payment");
    expect(params.line_items[0].price_data.currency).toBe("czk");
    expect(params.line_items[0].price_data.unit_amount).toBe(9900);
    expect(params.success_url).toBe("https://cvecko.example/?checkout=success&session_id={CHECKOUT_SESSION_ID}");
    expect(params.cancel_url).toBe("https://cvecko.example/?checkout=cancel");
    expect(params.metadata).toEqual({ product: "cv-access", plan: "14d" });
  });
});

describe("verifyCheckout", () => {
  it("accepts only paid sessions of our product", async () => {
    expect(await verifyCheckout("cs_test_abc", fakeStripe().client)).toEqual({ plan: "14d", created: 1000 });
    const unpaid = fakeStripe({ retrieve: vi.fn().mockResolvedValue({ payment_status: "unpaid", metadata: { product: "cv-access" } }) });
    expect(await verifyCheckout("cs_test_abc", unpaid.client)).toBeNull();
    const other = fakeStripe({ retrieve: vi.fn().mockResolvedValue({ payment_status: "paid", metadata: {} }) });
    expect(await verifyCheckout("cs_test_abc", other.client)).toBeNull();
  });

  it("rejects malformed ids without calling Stripe", async () => {
    const { client, retrieve } = fakeStripe();
    expect(await verifyCheckout("../../v1/charges", client)).toBeNull();
    expect(await verifyCheckout("", client)).toBeNull();
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("treats Stripe errors as unpaid", async () => {
    const { client } = fakeStripe({ retrieve: vi.fn().mockRejectedValue(new Error("No such session")) });
    expect(await verifyCheckout("cs_test_missing", client)).toBeNull();
  });
});

describe("appOrigin", () => {
  it("prefers APP_URL", () => {
    vi.stubEnv("APP_URL", "https://cvecko.cz/");
    expect(appOrigin(new Request("http://evil.example/api/checkout"))).toBe("https://cvecko.cz");
  });
  it("falls back to the request origin", () => {
    vi.stubEnv("APP_URL", "");
    expect(appOrigin(new Request("http://localhost:3000/api/checkout"))).toBe("http://localhost:3000");
  });
});
