import { expect, test } from "@playwright/test";

test.describe("landing", () => {
  test("CTA jumps to the studio", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("main").getByRole("link", { name: "Vytvořit životopis" }).click();
    await expect(page).toHaveURL(/#studio$/);
    await expect(page.getByLabel("Napiš o sobě cokoliv")).toBeInViewport();
  });

  test("shows three template samples", async ({ page }) => {
    await page.goto("/");
    const showcase = page.getByRole("img", { name: "Ukázky šablon" });
    await expect(showcase).toBeVisible();
    for (const name of ["Aura", "Švýcar", "Bento"]) {
      await expect(showcase.getByText(name, { exact: true })).toBeVisible();
    }
  });

  test("privacy page is linked and says we do not store data", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Zásady ochrany osobních údajů" }).click();
    await expect(page).toHaveURL(/\/soukromi$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Zásady ochrany osobních údajů");
    await expect(page.getByText("tvoje data neukládáme.")).toBeVisible();
    await page.getByRole("link", { name: "← Zpět na tvorbu životopisu" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("no horizontal scroll on the landing", async ({ page }) => {
    await page.goto("/");
    const { sw, w } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: window.innerWidth }));
    expect(sw).toBeLessThanOrEqual(w);
  });
});
