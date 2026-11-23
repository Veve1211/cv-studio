import { afterEach, describe, expect, it, vi } from "vitest";
import { createHealthHandler } from "./handler";

const PDF = new Uint8Array(Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(2000)]));
const get = (token?: string) =>
  new Request("http://localhost/api/health", { headers: token === undefined ? {} : { "x-smoke-token": token } });

describe("GET /api/health", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("without a token: 200 with the commit, Chromium never starts", async () => {
    vi.stubEnv("SMOKE_TOKEN", "secret-token");
    vi.stubEnv("RAILWAY_GIT_COMMIT_SHA", "abc123");
    const render = vi.fn();
    const res = await createHealthHandler({ render })(get());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", version: "abc123" });
    expect(render).not.toHaveBeenCalled();
  });

  it("wrong token: 401, Chromium never starts", async () => {
    vi.stubEnv("SMOKE_TOKEN", "secret-token");
    const render = vi.fn();
    const res = await createHealthHandler({ render })(get("guess"));
    expect(res.status).toBe(401);
    expect(render).not.toHaveBeenCalled();
  });

  it("without SMOKE_TOKEN on the server: any token is refused", async () => {
    vi.stubEnv("SMOKE_TOKEN", "");
    const render = vi.fn();
    expect((await createHealthHandler({ render })(get(""))).status).toBe(401);
    expect((await createHealthHandler({ render })(get("anything"))).status).toBe(401);
    expect(render).not.toHaveBeenCalled();
  });

  it("right token: renders the fictional sample CV and reports success", async () => {
    vi.stubEnv("SMOKE_TOKEN", "secret-token");
    const render = vi.fn().mockResolvedValue(PDF);
    const res = await createHealthHandler({ render })(get("secret-token"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pdf.ok).toBe(true);
    expect(body.pdf.bytes).toBe(PDF.length);
    expect(render.mock.calls[0][0].cv.name).toBe("Tereza Nováková");
  });

  it("right token, Chromium fails: 503 with the reason (e.g. missing system library)", async () => {
    vi.stubEnv("SMOKE_TOKEN", "secret-token");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const render = vi.fn().mockRejectedValue(new Error("libnspr4.so: cannot open shared object file"));
    const res = await createHealthHandler({ render })(get("secret-token"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.pdf).toMatchObject({ ok: false, error: expect.stringContaining("libnspr4.so") });
  });

  it("right token + ?client=1: reports the seen client address, no Chromium", async () => {
    vi.stubEnv("SMOKE_TOKEN", "secret-token");
    const render = vi.fn();
    const req = new Request("http://localhost/api/health?client=1", {
      headers: { "x-smoke-token": "secret-token", "x-forwarded-for": "203.0.113.7, 10.0.0.1", "x-real-ip": "198.51.100.7" },
    });
    const res = await createHealthHandler({ render })(req);
    expect(res.status).toBe(200);
    expect((await res.json()).client).toEqual({
      key: "203.0.113.7",
      forwardedFor: "203.0.113.7, 10.0.0.1",
      realIp: "198.51.100.7",
      rateLimitDisabled: false,
    });
    expect(render).not.toHaveBeenCalled();
  });

  it("?client=1 without the right token reveals nothing", async () => {
    vi.stubEnv("SMOKE_TOKEN", "secret-token");
    const plain = await createHealthHandler({ render: vi.fn() })(new Request("http://localhost/api/health?client=1"));
    expect(await plain.json()).not.toHaveProperty("client");
    const wrong = await createHealthHandler({ render: vi.fn() })(
      new Request("http://localhost/api/health?client=1", { headers: { "x-smoke-token": "nope" } }),
    );
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).not.toHaveProperty("client");
  });
});
