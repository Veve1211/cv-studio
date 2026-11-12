import { expect, test } from "@playwright/test";
import { loadSample } from "./helpers";

test.describe("phone layout", () => {
  test.skip(({ isMobile }) => !isMobile, "phones only");

  test("main actions sit in the bottom third (thumb reach) and are big enough", async ({ page }) => {
    await page.goto("/#studio");
    const viewport = page.viewportSize()!;
    const bar = page.getByRole("navigation", { name: "Ovládání na mobilu" });
    for (const name of ["Text", "Náhled", "Vytvořit životopis"]) {
      const box = (await bar.getByRole("button", { name }).boundingBox())!;
      expect(box.y).toBeGreaterThan(viewport.height * 0.66);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("the bottom bar creates the CV and then offers the PDF", async ({ page }) => {
    await page.goto("/#studio");
    await page.getByLabel("Napiš o sobě cokoliv").fill("Jsem Tereza z Brna, šest let dělám produktový design.");
    const bar = page.getByRole("navigation", { name: "Ovládání na mobilu" });
    await bar.getByRole("button", { name: "Vytvořit životopis" }).click();
    await expect(page.locator("#cv-page")).toContainText("Tereza Nováková");
    await expect(bar.getByRole("button", { name: "Stáhnout PDF" })).toBeEnabled();
  });

  test("zoom makes the page bigger without scrolling the whole page sideways", async ({ page }) => {
    await loadSample(page);
    const width = page.viewportSize()!.width;
    const fit = (await page.locator("#cv-page").boundingBox())!.width;
    await page.getByRole("group", { name: "Přiblížení náhledu" }).getByRole("button", { name: "2×" }).click();
    await expect.poll(async () => (await page.locator("#cv-page").boundingBox())!.width).toBeGreaterThan(fit * 1.9);
    // Only the preview box scrolls; the document never does.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const scroller = page.getByTestId("preview-scroller");
    expect(await scroller.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await page.getByRole("button", { name: "Celá" }).click();
    await expect.poll(async () => Math.round((await page.locator("#cv-page").boundingBox())!.width)).toBe(Math.round(fit));
  });

  test("no horizontal scroll in either view", async ({ page }) => {
    await loadSample(page);
    const width = page.viewportSize()!.width;
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole("navigation", { name: "Ovládání na mobilu" }).getByRole("button", { name: "Text" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
});

test("the bottom bar is not shown on desktop", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only");
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Ovládání na mobilu" })).toBeHidden();
});
