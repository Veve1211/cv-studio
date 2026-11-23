import type { z } from "zod";

export function jsonError(message: string, status: number, headers?: HeadersInit): Response {
  return Response.json({ error: message }, { status, headers });
}

/**
 * Reads a JSON body with a size cap; returns null when it is missing or invalid.
 * Only `Content-Type: application/json` is accepted: another site can send a plain
 * form (text/plain) from a visitor's browser without asking, but not JSON.
 */
export async function readJson(request: Request, maxBytes = 64_000): Promise<unknown | null> {
  const type = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (type !== "application/json") return null;
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) return null;
  try {
    const body = await request.text();
    if (body.length > maxBytes) return null;
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Neplatný požadavek.";
}
