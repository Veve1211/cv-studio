import { MAX_INPUT_CHARS } from "@/lib/cv/schema";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_PDF_PAGES = 20;

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

async function docxText(bytes: Uint8Array): Promise<string> {
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
