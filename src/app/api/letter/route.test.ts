import { beforeEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_CV } from "@/lib/cv/sample";
import { MOCK_LETTER } from "@/lib/letter/generate";

const post = (body: unknown) =>
  new Request("http://localhost/api/letter", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "4.4.4.4" },
    body: JSON.stringify(body),
  });

describe("POST /api/letter", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("E2E_MOCK_AI", "1");
  });

  it("returns a letter", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ cv: SAMPLE_CV, job: "Hledáme produktovou designérku do našeho týmu v Brně." }));
    expect(res.status).toBe(200);
    expect((await res.json()).letter).toEqual(MOCK_LETTER);
  });

  it("asks for the job ad in Czech", async () => {
    const { POST } = await import("./route");
    const res = await POST(post({ cv: SAMPLE_CV, job: "krátké" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("inzerátu");
  });
});
