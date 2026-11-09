import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectKind, extractText, MAX_UPLOAD_BYTES, tidyText } from "./extract-text";

const fixture = (name: string) => new Uint8Array(readFileSync(path.join(import.meta.dirname, "__fixtures__", name)));

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

  it("tidies whitespace but keeps paragraphs", () => {
    expect(tidyText("a  b\r\n\r\n\r\n\tc \n d")).toBe("a b\n\nc\nd");
  });
});
