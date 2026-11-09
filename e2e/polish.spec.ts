import { expect, test } from "@playwright/test";

test("unknown pages show a Czech 404", async ({ page }) => {
  const res = await page.goto("/neexistuje");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tahle stránka tu není");
  await page.getByRole("link", { name: "Zpět na Cvéčko" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("Ctrl+Enter submits the text", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard shortcut");
  await page.goto("/");
  const field = page.getByLabel("Napiš o sobě cokoliv");
  await field.fill("Jsem Tereza z Brna, šest let dělám produktový design.");
  await field.press("Control+Enter");
  await expect(page.locator("#cv-page")).toContainText("Tereza Nováková");
});

test("security headers are set", async ({ request }) => {
  const res = await request.get("/");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  expect(res.headers()["x-frame-options"]).toBe("DENY");
  expect(res.headers()["x-powered-by"]).toBeUndefined();
});
