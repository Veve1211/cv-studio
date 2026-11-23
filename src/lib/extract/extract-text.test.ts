import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectKind, extractText, MAX_UNZIPPED_BYTES, MAX_UPLOAD_BYTES, tidyText, zipUncompressedSize } from "./extract-text";

const fixture = (name: string) => new Uint8Array(readFileSync(path.join(import.meta.dirname, "__fixtures__", name)));

/** Minimal ZIP (word/document.xml) whose central directory declares `declaredSize` bytes. */
function fakeDocx(declaredSize: number): Uint8Array {
  const name = new TextEncoder().encode("word/document.xml");
  const local = new Uint8Array(30 + name.length);
  const lv = new DataView(local.buffer);
  lv.setUint32(0, 0x04034b50, true);
  lv.setUint16(26, name.length, true);
  local.set(name, 30);
  const central = new Uint8Array(46 + name.length);
  const cv = new DataView(central.buffer);
  cv.setUint32(0, 0x02014b50, true);
  cv.setUint32(24, declaredSize, true);
  cv.setUint16(28, name.length, true);
  central.set(name, 46);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, 1, true);
  ev.setUint16(10, 1, true);
  ev.setUint32(12, central.length, true);
  ev.setUint32(16, local.length, true);
  const out = new Uint8Array(local.length + central.length + end.length);
  out.set(local, 0);
  out.set(central, local.length);
  out.set(end, local.length + central.length);
  return out;
}

describe("extractText", () => {
  it("reads a PDF CV with Czech characters", async () => {
    const result = await extractText(fixture("zivotopis.pdf"));
    expect(result.kind).toBe("pdf");
    expect(result.text).toContain("Jana Kovářová");
    expect(result.text).toContain("Ocel a.s.");
    expect(result.text).toContain("angličtina B2");
    expect(result.truncated).toBe(false);
  });

  it("reads a DOCX CV", async () => {
    const result = await extractText(fixture("zivotopis.docx"));
    expect(result.kind).toBe("docx");
    expect(result.text).toContain("Tomáš Novotný");
    expect(result.text).toContain("Alza.cz");
    expect(result.text.split("\n").length).toBeGreaterThan(3);
  });

  it("detects the type by content, not by name", () => {
    expect(detectKind(fixture("zivotopis.pdf"))).toBe("pdf");
    expect(detectKind(fixture("zivotopis.docx"))).toBe("docx");
    expect(detectKind(fixture("falesne.pdf"))).toBeNull();
    expect(detectKind(fixture("archiv.docx"))).toBeNull();
  });

  it("rejects unsupported, empty, huge and image-only files with Czech messages", async () => {
    await expect(extractText(fixture("falesne.pdf"))).rejects.toMatchObject({ status: 415, message: expect.stringContaining("PDF nebo Word") });
    await expect(extractText(new Uint8Array())).rejects.toMatchObject({ status: 400 });
    await expect(extractText(new Uint8Array(MAX_UPLOAD_BYTES + 1))).rejects.toMatchObject({ status: 413 });
    await expect(extractText(fixture("sken.pdf"))).rejects.toMatchObject({ status: 422, message: expect.stringContaining("sken") });
  });

  it("reads the unpacked size of a real DOCX before unpacking it", () => {
    const size = zipUncompressedSize(fixture("zivotopis.docx"));
    expect(size).toBeGreaterThan(0);
    expect(size).toBeLessThan(MAX_UNZIPPED_BYTES);
    expect(zipUncompressedSize(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBeNull();
  });

  it("refuses a zip bomb disguised as DOCX without unpacking it", async () => {
    await expect(extractText(fakeDocx(MAX_UNZIPPED_BYTES + 1))).rejects.toMatchObject({ status: 413 });
  });

  it("tidies whitespace but keeps paragraphs", () => {
    expect(tidyText("a  b\r\n\r\n\r\n\tc \n d")).toBe("a b\n\nc\nd");
  });
});
