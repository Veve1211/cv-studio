import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_CV } from "@/lib/cv/schema";
import { SAMPLE_CV } from "@/lib/cv/sample";
import { MOCK_SUMMARY } from "@/lib/cv/summary";

const post = (body: unknown) =>
  new Request("http://localhost/api/summary", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "8.8.8.8" },
    body: JSON.stringify(body),
  });

describe("POST /api/summary", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("E2E_MOCK_AI", "1");
  });

  it("returns an improved summary", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ cv: SAMPLE_CV }));
    expect(res.status).toBe(200);
    expect((await res.json()).summary).toBe(MOCK_SUMMARY);
  });

  it("rejects invalid CV data", async () => {
    const { POST } = await import("./route");
    expect((await POST(post({ cv: { name: 1 } }))).status).toBe(400);
  });

  it("refuses when there is nothing to summarise", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ cv: EMPTY_CV }));
    expect(res.status).toBe(422);
  });
});
