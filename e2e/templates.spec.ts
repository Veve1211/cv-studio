import { expect, test } from "@playwright/test";
import { LONG_SAMPLE_CV } from "../src/lib/cv/sample";
import { loadSample, pickRadio } from "./helpers";

const TEMPLATES = [
  ["Časopis", "magazine"],
  ["Časová osa", "timeline"],
  ["Minimal", "minimal"],
  ["Blok", "block"],
  ["Terminál", "terminal"],
] as const;

test.describe("templates", () => {
  test("switching templates re-renders the same CV", async ({ page }) => {
    await loadSample(page);
    for (const [name, id] of TEMPLATES) {
      const radio = await pickRadio(page, name);
      await expect(radio).toBeChecked();
      const article = page.locator("#cv-page");
      await expect(article).toHaveAttribute("data-template", id);
      await expect(article).toContainText("Tereza Nováková");
      await expect(article).toContainText("Masarykova univerzita");
    }
  });

  test("accent colour applies to the page", async ({ page }) => {
    await loadSample(page);
    const radio = await pickRadio(page, "Smaragdová");
    await expect(radio).toBeChecked();
    const accent = await page.locator("#cv-page").evaluate((el) => getComputedStyle(el).getPropertyValue("--accent").trim());
    expect(accent).toBe("#0b7a5c");
  });

  test("templates can be chosen with the keyboard", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard navigation is a desktop concern");
    await loadSample(page);
    await page.getByRole("radio", { name: "Časopis", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: "Časová osa", exact: true })).toBeChecked();
    await expect(page.locator("#cv-page")).toHaveAttribute("data-template", "timeline");
  });

  test("long CVs never overflow the page width in any template", async ({ page }) => {
    await page.route("/api/cv", (route) => route.fulfill({ json: { cv: LONG_SAMPLE_CV } }));
    await page.goto("/");
    await page.getByLabel("Napiš o sobě cokoliv").fill("Dlouhý text o mně, mám jedenáct let praxe v IT.");
    await page.getByRole("button", { name: "Vytvořit životopis" }).click();
    await expect(page.locator("#cv-page")).toContainText("Jan Dvořák");
    for (const [name] of TEMPLATES) {
      await pickRadio(page, name);
      const overflow = await page
        .locator("#cv-page")
        .evaluate((el) => el.scrollWidth - (el as HTMLElement).clientWidth);
      expect(overflow, `${name} overflows horizontally`).toBeLessThanOrEqual(1);
    }
  });

  test("thumbnails are hidden from assistive tech", async ({ page }) => {
    await loadSample(page);
    // Only the real preview counts as a CV article; thumbnails are aria-hidden.
    await expect(page.getByRole("heading", { name: "Tereza Nováková" })).toHaveCount(1);
  });
});
