import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_CV } from "@/lib/cv/sample";
import { createPdfHandler } from "./handler";

const body = (extra: Record<string, unknown> = {}) => ({
  sessionId: "cs_test_abc",
  cv: SAMPLE_CV,
  templateId: "block",
  accentId: "sky",
  ...extra,
});
const post = (b: unknown) =>
  new Request("http://localhost/api/pdf", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "1.1.1.1" },
    body: JSON.stringify(b),
  });

describe("POST /api/pdf", () => {
  beforeEach(() => vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x"));
  afterEach(() => vi.unstubAllEnvs());

  it("renders a PDF with full access", async () => {
    const render = vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
    const handler = createPdfHandler({ verify: () => true, render });
    const res = await handler(post(body()));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("Zivotopis-Tereza-Novakova.pdf");
    expect(render).toHaveBeenCalledWith({ cv: SAMPLE_CV, templateId: "block", accentId: "sky" });
  });

  it("refuses without access, without rendering", async () => {
    const render = vi.fn();
    const handler = createPdfHandler({ verify: () => false, render });
    const res = await handler(post(body()));
    expect(res.status).toBe(402);
    expect(render).not.toHaveBeenCalled();
  });

  it("validates the payload", async () => {
    const handler = createPdfHandler({ verify: () => true, render: vi.fn() });
    expect((await handler(post(body({ templateId: "evil" })))).status).toBe(400);
    expect((await handler(post({ sessionId: "cs_test_abc" }))).status).toBe(400);
  });

  it("is off without a Stripe key (browser print is used instead)", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const handler = createPdfHandler({ verify: () => true, render: vi.fn() });
    expect((await handler(post(body()))).status).toBe(404);
  });

  it("reports rendering failures in Czech", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = createPdfHandler({ verify: () => true, render: vi.fn().mockRejectedValue(new Error("boom")) });
    const res = await handler(post(body()));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("PDF");
  });
});
