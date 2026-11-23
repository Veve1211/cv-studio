import { MAX_INPUT_CHARS } from "@/lib/cv/schema";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_PDF_PAGES = 20;
/** A real CV in Word unpacks to a few MB at most; more means a "zip bomb". */
export const MAX_UNZIPPED_BYTES = 30 * 1024 * 1024;

export type FileKind = "pdf" | "docx";

/** Error with a Czech message safe to show to the user. */
export class ExtractError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ExtractError";
  }
}

export const UNSUPPORTED_MESSAGE = "Tenhle soubor neumíme přečíst. Nahraj prosím PDF nebo Word (DOCX) do 5 MB.";

/** Detects the real type from the file content (magic bytes), not from its name. */
export function detectKind(bytes: Uint8Array): FileKind | null {
  const head = String.fromCharCode(...bytes.subarray(0, 5));
  if (head === "%PDF-") return "pdf";
  // DOCX is a ZIP archive containing word/document.xml
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    const probe = new TextDecoder("latin1").decode(bytes.subarray(0, Math.min(bytes.length, 200_000)));
    if (probe.includes("word/")) return "docx";
  }
  return null;
}

/** Collapses whitespace but keeps paragraph breaks. */
export function tidyText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function pdfText(bytes: Uint8Array): Promise<string> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({ data: bytes, useSystemFonts: false, stopAtErrors: false });
  try {
    const doc = await task.promise;
    const pages: string[] = [];
    for (let i = 1; i <= Math.min(doc.numPages, MAX_PDF_PAGES); i++) {
      const content = await (await doc.getPage(i)).getTextContent();
      let page = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        page += item.str + (item.hasEOL ? "\n" : "");
      }
      pages.push(page);
    }
    return pages.join("\n\n");
  } catch (error) {
    if (error instanceof Error && error.name === "PasswordException") {
      throw new ExtractError("PDF je zaheslované. Nahraj prosím verzi bez hesla.", 422);
    }
    throw new ExtractError("PDF se nepodařilo přečíst. Je možná poškozené.", 422);
  } finally {
    await task.destroy();
  }
}

/**
 * Sum of the uncompressed sizes listed in the ZIP central directory, read before
 * anything is unpacked. Infinity for ZIP64 (far too big for a CV), null when the
 * directory can't be read. The sizes are declared by the file itself, so this stops
 * ordinary zip bombs, not a deliberately forged directory.
 */
export function zipUncompressedSize(bytes: Uint8Array): number | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // End of central directory record: 22 bytes + an optional comment of up to 64 KiB.
  const lowest = Math.max(0, bytes.length - 22 - 0xffff);
  for (let i = bytes.length - 22; i >= lowest; i--) {
    if (view.getUint32(i, true) !== 0x06054b50) continue;
    const entries = view.getUint16(i + 10, true);
    let offset = view.getUint32(i + 16, true);
    let total = 0;
    for (let n = 0; n < entries; n++) {
      if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) return null;
      const size = view.getUint32(offset + 24, true);
      if (size === 0xffffffff) return Infinity;
      total += size;
      offset +=
        46 + view.getUint16(offset + 28, true) + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
    }
    return total;
  }
  return null;
}

async function docxText(bytes: Uint8Array): Promise<string> {
  const unzipped = zipUncompressedSize(bytes);
  if (unzipped === null) throw new ExtractError("Dokument Word se nepodařilo přečíst. Je možná poškozený.", 422);
  if (unzipped > MAX_UNZIPPED_BYTES) throw new ExtractError("Dokument Word je po rozbalení příliš velký.", 413);
  const mammoth = await import("mammoth");
  try {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return result.value;
  } catch {
    throw new ExtractError("Dokument Word se nepodařilo přečíst. Je možná poškozený.", 422);
  }
}

/**
 * Extracts plain text from an uploaded PDF or DOCX. Everything happens in memory;
 * the file and the text are never written anywhere.
 */
export async function extractText(bytes: Uint8Array): Promise<{ text: string; kind: FileKind; truncated: boolean }> {
  if (bytes.byteLength === 0) throw new ExtractError("Soubor je prázdný.", 400);
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new ExtractError("Soubor je větší než 5 MB.", 413);
  const kind = detectKind(bytes);
  if (!kind) throw new ExtractError(UNSUPPORTED_MESSAGE, 415);

  const raw = kind === "pdf" ? await pdfText(bytes) : await docxText(bytes);
  const text = tidyText(raw);
  if (text.length < 20) {
    throw new ExtractError(
      kind === "pdf"
        ? "V PDF jsme nenašli žádný text – nejspíš je to naskenovaný obrázek. Zkopíruj prosím text ručně."
        : "V dokumentu jsme nenašli skoro žádný text.",
      422,
    );
  }
  const truncated = text.length > MAX_INPUT_CHARS;
  return { text: truncated ? text.slice(0, MAX_INPUT_CHARS) : text, kind, truncated };
}
