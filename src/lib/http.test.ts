import { describe, expect, it } from "vitest";
import { readJson } from "./http";

const post = (body: string, contentType?: string) =>
  new Request("http://localhost/api/cv", {
    method: "POST",
    body,
    headers: contentType ? { "content-type": contentType } : {},
  });

describe("readJson", () => {
  it("reads a JSON body", async () => {
    expect(await readJson(post('{"text":"ahoj"}', "application/json"))).toEqual({ text: "ahoj" });
    expect(await readJson(post('{"a":1}', "Application/JSON; charset=utf-8"))).toEqual({ a: 1 });
  });

  it("refuses bodies a cross-site form could send", async () => {
    expect(await readJson(post('{"text":"ahoj"}', "text/plain"))).toBeNull();
    expect(await readJson(post('{"text":"ahoj"}', "application/x-www-form-urlencoded"))).toBeNull();
    expect(await readJson(post('{"text":"ahoj"}'))).toBeNull();
  });

  it("refuses invalid or oversized JSON", async () => {
    expect(await readJson(post("{nope", "application/json"))).toBeNull();
    expect(await readJson(post(JSON.stringify({ t: "x".repeat(100) }), "application/json"), 50)).toBeNull();
  });
});
