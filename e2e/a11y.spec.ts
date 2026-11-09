import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { TEMPLATES } from "../src/components/templates";
import { loadSample, pickRadio } from "./helpers";

async function scan(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")})`);
  expect(summary).toEqual([]);
}

test.describe("accessibility (axe, WCAG 2.1 AA)", () => {
  test("home page", async ({ page }) => {
    await page.goto("/");
    await scan(page);
  });

  for (const name of TEMPLATES.map((t) => t.name)) {
    test(`with a generated CV in ${name}`, async ({ page }) => {
      await loadSample(page);
      await pickRadio(page, name);
      await scan(page);
    });
  }

  test("skip link jumps to the studio", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard only");
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Přeskočit na tvorbu životopisu" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#studio$/);
  });

  test("privacy page", async ({ page }) => {
    await page.goto("/soukromi");
    await scan(page);
  });
});
