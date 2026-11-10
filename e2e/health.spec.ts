import { expect, test } from "@playwright/test";
import { PAYWALL_PORT } from "../playwright.config";

// The paywall server has SMOKE_TOKEN, a print secret and a real Chromium.
test.use({ baseURL: `http://localhost:${PAYWALL_PORT}` });
test.skip(({ isMobile }) => isMobile, "server side only");

test.describe("/api/health", () => {
  test("is public, but only says it is up", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(typeof body.version).toBe("string");
    expect(body.pdf).toBeUndefined();
  });

  test("a wrong token gets 401", async ({ request }) => {
    const res = await request.get("/api/health", { headers: { "x-smoke-token": "wrong" } });
    expect(res.status()).toBe(401);
  });

  test("with the token the server really renders a PDF in Chromium", async ({ request }) => {
    const res = await request.get("/api/health", { headers: { "x-smoke-token": "e2e-smoke-token" } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.pdf.ok).toBe(true);
    expect(body.pdf.bytes).toBeGreaterThan(1000);
  });
});
