import { expect, test } from "@playwright/test";

const ABOUT =
  "Jsem Tereza z Brna, šest let dělám produktový design. Teď v Kvetoucí s.r.o., předtím Agentura Pixel. Figma, výzkum, angličtina C1.";

test.describe("studio", () => {
  test("generates a CV from free text", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Napiš o sobě cokoliv").fill(ABOUT);
    await page.getByRole("button", { name: "Vytvořit životopis" }).click();

    const preview = page.getByRole("article", { name: "Náhled životopisu" });
    await expect(preview).toBeVisible();
    await expect(preview).toContainText("Tereza Nováková");
    await expect(preview).toContainText("Kvetoucí s.r.o.");
  });

  test("shows a Czech error for too short text", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Napiš o sobě cokoliv").fill("ahoj");
    await page.getByRole("button", { name: "Vytvořit životopis" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toContainText("aspoň pár vět");
  });

  test("shows the server error message", async ({ page }) => {
    await page.route("/api/cv", (route) =>
      route.fulfill({ status: 503, json: { error: "AI je teď přetížená. Zkus to prosím za chvíli." } }),
    );
    await page.goto("/");
    await page.getByLabel("Napiš o sobě cokoliv").fill(ABOUT);
    await page.getByRole("button", { name: "Vytvořit životopis" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toContainText("přetížená");
  });

  test("shows a loading state while generating", async ({ page }) => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    await page.route("/api/cv", async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto("/");
    await page.getByLabel("Napiš o sobě cokoliv").fill(ABOUT);
    await page.getByRole("button", { name: "Vytvořit životopis" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Čtu tvůj text" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Vytvářím…" })).toBeDisabled();
    release();
    await expect(page.getByRole("article", { name: "Náhled životopisu" })).toBeVisible();
  });

  test("sample button fills the preview without AI", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ukázka" }).click();
    await expect(page.getByRole("article", { name: "Náhled životopisu" })).toContainText("Tereza Nováková");
  });

  test("preview fits the screen width", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ukázka" }).click();
    const box = await page.locator("#cv-page").boundingBox();
    const width = page.viewportSize()!.width;
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(width);
  });

  test("page is a real A4 sheet styled by the template", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ukázka" }).click();
    const size = await page.locator("#cv-page").evaluate((el) => ({ w: (el as HTMLElement).offsetWidth, h: (el as HTMLElement).offsetHeight }));
    // 210 mm = 793.7 CSS px; 297 mm = 1122.5 CSS px
    expect(Math.round(size.w)).toBe(794);
    expect(size.h).toBeGreaterThanOrEqual(1122);
  });

  test("on mobile, Text / Náhled switch between the form and the preview", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile layout only");
    await page.goto("/");
    const bar = page.getByRole("navigation", { name: "Ovládání na mobilu" });
    await expect(bar.getByRole("button", { name: "Náhled" })).toBeDisabled();
    await page.getByRole("button", { name: "Ukázka" }).click();
    // The sample switches to the preview on its own.
    await expect(page.locator("#cv-page")).toBeVisible();
    await expect(page.getByLabel("Napiš o sobě cokoliv")).toBeHidden();
    await expect(bar.getByRole("button", { name: "Náhled" })).toHaveAttribute("aria-pressed", "true");
    await bar.getByRole("button", { name: "Text" }).click();
    await expect(page.getByLabel("Napiš o sobě cokoliv")).toBeVisible();
    await expect(page.locator("#cv-page")).toBeHidden();
  });
});
