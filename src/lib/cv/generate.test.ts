import Anthropic from "@anthropic-ai/sdk";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CvError, generateCv, mapApiError, SYSTEM_PROMPT, type MessagesClient } from "./generate";
import { CV_JSON_SCHEMA, CvSchema, GenerateRequestSchema } from "./schema";
import { SAMPLE_CV } from "./sample";

function fakeClient(response: { stop_reason: string | null; content: Array<{ type: string; text?: string }> }) {
  const create = vi.fn().mockResolvedValue(response);
  const client: MessagesClient = { beta: { messages: { create } } };
  return { client, create };
}

const ok = (payload: unknown) => ({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(payload) }] });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateCv", () => {
  it("returns validated CV data from the model", async () => {
    const { client, create } = fakeClient(ok(SAMPLE_CV));
    const cv = await generateCv("Jsem designérka, pracuji v Brně šest let.", client);
    expect(cv).toEqual(SAMPLE_CV);

    const params = create.mock.calls[0][0];
    expect(params.model).toBe("claude-opus-5-5");
    expect(params.output_config.format).toEqual({ type: "json_schema", schema: CV_JSON_SCHEMA });
    expect(params.system).toBe(SYSTEM_PROMPT);
    expect(params.messages[0].content).toContain("Jsem designérka");
  });

  it("trims strings coming from the model", async () => {
    const { client } = fakeClient(ok({ ...SAMPLE_CV, name: "  Tereza  " }));
    const cv = await generateCv("x".repeat(30), client);
    expect(cv.name).toBe("Tereza");
  });

  it("rejects output in the wrong shape with a Czech message", async () => {
    const { client } = fakeClient(ok({ name: "Jen jméno" }));
    await expect(generateCv("x".repeat(30), client)).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining("nečekaném tvaru"),
    });
  });

  it("handles invalid JSON", async () => {
    const { client } = fakeClient({ stop_reason: "end_turn", content: [{ type: "text", text: "{nope" }] });
    await expect(generateCv("x".repeat(30), client)).rejects.toBeInstanceOf(CvError);
  });

  it("handles refusals and truncated output", async () => {
    const refused = fakeClient({ stop_reason: "refusal", content: [] });
    await expect(generateCv("x".repeat(30), refused.client)).rejects.toMatchObject({ status: 422 });
    const truncated = fakeClient({ stop_reason: "max_tokens", content: [] });
    await expect(generateCv("x".repeat(30), truncated.client)).rejects.toMatchObject({
      message: expect.stringContaining("zkrátit"),
    });
  });

  it("maps API errors without leaking details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const create = vi.fn().mockRejectedValue(new Error("boom"));
    const client: MessagesClient = { beta: { messages: { create } } };
    await expect(generateCv("x".repeat(30), client)).rejects.toMatchObject({ status: 500 });
  });

  it("never logs the user's text on failure", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const secret = "Moje tajná adresa Dlouhá 12";
    const create = vi.fn().mockRejectedValue(new Error(secret));
    const client: MessagesClient = { beta: { messages: { create } } };
    await expect(generateCv(secret, client)).rejects.toBeInstanceOf(CvError);
    expect(JSON.stringify(spy.mock.calls)).not.toContain("Dlouhá");
  });

  it("maps a rate limit to a friendly message", () => {
    const err = Object.create(Anthropic.RateLimitError.prototype);
    expect(mapApiError(err).message).toContain("přetížená");
  });
});

describe("schemas", () => {
  it("validates request text length", () => {
    expect(GenerateRequestSchema.safeParse({ text: "krátké" }).success).toBe(false);
    expect(GenerateRequestSchema.safeParse({ text: "a".repeat(15_001) }).success).toBe(false);
    expect(GenerateRequestSchema.safeParse({ text: 42 }).success).toBe(false);
    expect(GenerateRequestSchema.safeParse({ text: "Jsem vývojář s praxí v Praze." }).success).toBe(true);
  });

  it("returns Czech validation messages", () => {
    const r = GenerateRequestSchema.safeParse({ text: "krátké" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toContain("aspoň pár vět");
  });

  it("sample data matches the schema", () => {
    expect(CvSchema.safeParse(SAMPLE_CV).success).toBe(true);
  });

  it("JSON schema is strict everywhere (structured outputs requirement)", () => {
    const walk = (node: unknown): void => {
      if (!node || typeof node !== "object") return;
      const n = node as Record<string, unknown>;
      if (n.type === "object") {
        expect(n.additionalProperties).toBe(false);
        expect(n.required).toEqual(Object.keys(n.properties as object));
      }
      Object.values(n).forEach(walk);
    };
    walk(CV_JSON_SCHEMA);
  });

  it("JSON schema and zod schema have the same top-level keys", () => {
    expect(Object.keys(CV_JSON_SCHEMA.properties).sort()).toEqual(Object.keys(CvSchema.shape).sort());
  });
});

describe("AI timeout", () => {
  it("ends a hanging AI request with a Czech message and logs it without the user's text", async () => {
    const { requestStructured, AI_TIMEOUT_MESSAGE } = await import("./generate");
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const hanging: MessagesClient = { beta: { messages: { create: () => new Promise(() => {}) } } };
    const secret = "Jana Tajná, rodné číslo 123";
    await expect(
      requestStructured(hanging, { system: "s", userContent: secret, schema: {}, maxTokens: 10, label: "letter" }, 50),
    ).rejects.toMatchObject({ message: AI_TIMEOUT_MESSAGE, status: 504 });
    const logged = errors.mock.calls.flat().join(" ");
    expect(logged).toContain("AI timeout: letter");
    expect(logged).not.toContain("Jana");
    errors.mockRestore();
  });
});
