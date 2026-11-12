import type { z } from "zod";
import { CvSchema, type Cv } from "./schema";

const SAFE_SEGMENT = /^(?:[a-zA-Z]+|\d{1,3})$/;

/**
 * Returns a copy of `doc` with the string at `path` (e.g. "experience.0.role")
 * replaced. Only existing string leaves can be changed; anything else (unknown keys,
 * prototype tricks, new array items) returns the document unchanged. The result is
 * validated again with `schema`.
 */
export function setTextAt<T>(doc: T, path: string, value: string, schema: z.ZodType<T>): T {
  const segments = path.split(".");
  if (segments.length === 0 || !segments.every((s) => SAFE_SEGMENT.test(s))) return doc;

  const next = structuredClone(doc) as unknown as Record<string, unknown>;
  let node: unknown = next;
  for (let i = 0; i < segments.length - 1; i++) {
    if (node === null || typeof node !== "object" || !Object.hasOwn(node, segments[i])) return doc;
    node = (node as Record<string, unknown>)[segments[i]];
  }
  const last = segments[segments.length - 1];
  if (node === null || typeof node !== "object" || !Object.hasOwn(node, last)) return doc;
  if (typeof (node as Record<string, unknown>)[last] !== "string") return doc;
  (node as Record<string, unknown>)[last] = value;

  const parsed = schema.safeParse(next);
  return parsed.success ? parsed.data : doc;
}

export function setCvText(cv: Cv, path: string, value: string): Cv {
  return setTextAt(cv, path, value, CvSchema);
}
