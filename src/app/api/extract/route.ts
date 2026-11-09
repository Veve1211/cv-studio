import { ExtractError, extractText, MAX_UPLOAD_BYTES, UNSUPPORTED_MESSAGE } from "@/lib/extract/extract-text";
import { jsonError } from "@/lib/http";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ limit: 30, windowMs: 15 * 60 * 1000 });

/** Upload → plain text. In memory only: nothing is stored or logged. */
export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  // multipart overhead is small; anything far above the limit is rejected before reading
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) return jsonError("Soubor je větší než 5 MB.", 413);
  if (!limiter(clientKey(request)).ok) return jsonError("Moc pokusů za sebou. Zkus to prosím za chvíli.", 429);

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return jsonError("Neplatný požadavek.", 400);
  }
  if (!(file instanceof File)) return jsonError(UNSUPPORTED_MESSAGE, 415);
  if (file.size > MAX_UPLOAD_BYTES) return jsonError("Soubor je větší než 5 MB.", 413);

  try {
    const result = await extractText(new Uint8Array(await file.arrayBuffer()));
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ExtractError) return jsonError(error.message, error.status);
    console.error("File extraction failed:", error instanceof Error ? error.name : typeof error);
    return jsonError("Soubor se nepodařilo přečíst. Zkus to prosím znovu.", 500);
  }
}
