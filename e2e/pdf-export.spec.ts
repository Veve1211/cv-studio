import { expect, test, type Page } from "@playwright/test";
import { LONG_SAMPLE_CV, SAMPLE_CV } from "../src/lib/cv/sample";
import type { Cv } from "../src/lib/cv/schema";
import { TEMPLATES as REGISTRY } from "../src/components/templates";
import { pickRadio } from "./helpers";
import { pdfPages, squash } from "./pdf";

const TEMPLATES = REGISTRY.map((t) => t.name);

async function openWith(page: Page, cv: Cv) {
  await page.route("/api/cv", (route) => route.fulfill({ json: { cv } }));
  await page.goto("/");
  await page.getByLabel("Napiš o sobě cokoliv").fill("Text o mně, mám praxi v oboru a umím anglicky.");
  await page.getByRole("button", { name: "Vytvořit životopis" }).click();
  await page.locator("#cv-page").waitFor();
}

/** Every text value of the CV, as it must appear somewhere in the PDF. */
function allTexts(cv: Cv): string[] {
  return [
    cv.name,
    cv.summary,
    ...cv.experience.flatMap((e) => [e.role, e.company, ...e.highlights]),
    ...cv.education.flatMap((e) => [e.school, e.degree]),
    ...cv.skills,
    ...cv.languages.map((l) => l.language),
  ].filter(Boolean);
}

test.describe("PDF export", () => {
  test.skip(({ isMobile }) => isMobile, "page.pdf() output does not depend on the viewport");

  for (const name of TEMPLATES) {
    test(`${name}: short CV is exactly one page`, async ({ page }) => {
      await openWith(page, SAMPLE_CV);
      await pickRadio(page, name);
      await page.evaluate(() => document.fonts.ready);
      const pages = await pdfPages(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
      expect(pages).toHaveLength(1);
      // Only the CV is printed, none of the app UI.
      expect(pages[0]).not.toContain(squash("Napiš o sobě cokoliv"));
      expect(pages[0]).not.toContain(squash("Vylepšit shrnutí"));
      expect(pages[0]).not.toContain(squash("Šablona"));
      expect(pages[0]).not.toContain(squash("Bez formulářů"));
      expect(pages[0]).not.toContain(squash("Zásady ochrany"));
    });

    test(`${name}: long CV flows onto page 2 without losing text`, async ({ page }) => {
      await openWith(page, LONG_SAMPLE_CV);
      await pickRadio(page, name);
      await page.evaluate(() => document.fonts.ready);
      const pages = await pdfPages(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
      expect(pages.length).toBeGreaterThanOrEqual(2);
      expect(pages.length).toBeLessThanOrEqual(3);
      // Case-insensitive (templates use text-transform) and tolerant of a drop-cap
      // initial, which PDF text extraction returns as a separate glyph.
      const all = pages.join("").toLowerCase();
      for (const text of allTexts(LONG_SAMPLE_CV)) {
        const expected = squash(text).toLowerCase();
        const found = all.includes(expected) || all.includes(expected.slice(1));
        expect(found, `missing in PDF: ${text}`).toBe(true);
      }
    });
  }

  test("Stáhnout PDF opens the print dialog with a clean file name", async ({ page }) => {
    await openWith(page, SAMPLE_CV);
    await page.evaluate(() => {
      (window as unknown as { __printedTitle?: string }).__printedTitle = undefined;
      window.print = () => {
        (window as unknown as { __printedTitle?: string }).__printedTitle = document.title;
      };
    });
    await page.getByRole("button", { name: "Stáhnout PDF" }).click();
    const printedTitle = await page.evaluate(() => (window as unknown as { __printedTitle?: string }).__printedTitle);
    expect(printedTitle).toBe("Zivotopis-Tereza-Novakova");
  });
});
