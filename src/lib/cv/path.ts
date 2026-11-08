import { CvSchema, type Cv } from "./schema";

const SAFE_SEGMENT = /^(?:[a-zA-Z]+|\d{1,3})$/;

/**
 * Returns a copy of the CV with the string at `path` (e.g. "experience.0.role")
 * replaced. Only existing string leaves can be changed; anything else (unknown keys,
 * prototype tricks, new array items) returns the CV unchanged.
 */
export function setCvText(cv: Cv, path: string, value: string): Cv {
  const segments = path.split(".");
  if (segments.length === 0 || !segments.every((s) => SAFE_SEGMENT.test(s))) return cv;

  const next = structuredClone(cv) as unknown as Record<string, unknown>;
  let node: unknown = next;
  for (let i = 0; i < segments.length - 1; i++) {
    if (node === null || typeof node !== "object" || !Object.hasOwn(node, segments[i])) return cv;
    node = (node as Record<string, unknown>)[segments[i]];
  }
  const last = segments[segments.length - 1];
  if (node === null || typeof node !== "object" || !Object.hasOwn(node, last)) return cv;
  if (typeof (node as Record<string, unknown>)[last] !== "string") return cv;
  (node as Record<string, unknown>)[last] = value;

  const parsed = CvSchema.safeParse(next);
  return parsed.success ? parsed.data : cv;
}
