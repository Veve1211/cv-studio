import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/** Returns the text of each PDF page with all whitespace removed (robust to letter-spacing). */
export async function pdfPages(buffer: Buffer): Promise<string[]> {
  const task = getDocument({ data: new Uint8Array(buffer), useSystemFonts: false });
  const doc = await task.promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ("str" in item ? item.str : "")).join("");
    pages.push(squash(text));
  }
  await task.destroy();
  return pages;
}

export const squash = (s: string) => s.replace(/\s+/g, "").normalize("NFC");
