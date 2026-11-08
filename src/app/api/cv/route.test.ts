import { beforeEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_CV } from "@/lib/cv/sample";

const post = (body: unknown, ip = "9.9.9.9") =>
  new Request("http://localhost/api/cv", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("POST /api/cv", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("E2E_MOCK_AI", "1");
  });

  it("returns a CV for valid text (mock mode)", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ text: "Jsem designérka z Brna a mám šest let praxe." }));
    expect(res.status).toBe(200);
    expect((await res.json()).cv).toEqual(SAMPLE_CV);
  });

  it("rejects too short text with a Czech message", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ text: "ahoj" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("aspoň pár vět");
  });

  it("rejects invalid JSON", async () => {
    const { POST } = await import("./route");
    const res = await POST(post("{not json"));
    expect(res.status).toBe(400);
  });

  it("rate limits repeated requests from one IP", async () => {
    const { POST } = await import("./route");
    const body = { text: "Jsem designérka z Brna a mám šest let praxe." };
    for (let i = 0; i < 10; i++) expect((await POST(post(body, "7.7.7.7"))).status).toBe(200);
    const res = await POST(post(body, "7.7.7.7"));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("explains a missing API key in Czech", async () => {
    vi.stubEnv("E2E_MOCK_AI", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { POST } = await import("./route");
    const res = await POST(post({ text: "Jsem designérka z Brna a mám šest let praxe." }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("klíč");
  });
});
