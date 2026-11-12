import { expect, test } from "@playwright/test";
import { PAYWALL_PORT } from "../playwright.config";

test.describe("selling landing", () => {
  test("before/after turns messy notes into a CV when scrolled into view", async ({ page }) => {
    await page.goto("/");
    const section = page.getByRole("region", { name: "Z neučesaných poznámek hotový životopis" });
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator("[data-shown]")).toBeAttached();
    await expect(section.getByText("tereza novakova, brno")).toBeVisible();
    await expect(section.locator(".ba-after")).toHaveCSS("opacity", "1", { timeout: 5000 });
    await section.getByRole("button", { name: "Přehrát znovu" }).click();
    await expect(section.locator(".ba-after")).toHaveCSS("opacity", "1", { timeout: 5000 });
  });

  test("FAQ answers open and close and the price is hidden without payments", async ({ page }) => {
    await page.goto("/");
    const faq = page.getByRole("region", { name: "Časté otázky" });
    const question = faq.getByText("Co AI dělá a co ne?");
    await question.click();
    await expect(faq.getByText(/Nepřidává firmy, roky, čísla/)).toBeVisible();
    await question.click();
    await expect(faq.getByText(/Nepřidává firmy, roky, čísla/)).toBeHidden();
    await expect(faq.getByText("Kolik to stojí?")).toHaveCount(0);
    await expect(page.getByRole("region", { name: /Náhled vždy zdarma/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Obchodní podmínky" })).toHaveCount(0);
    expect((await page.request.get("/obchodni-podminky")).status()).toBe(404);

    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faqLd = ld.map((t) => JSON.parse(t)).find((d) => d["@type"] === "FAQPage");
    expect(faqLd.mainEntity.length).toBe(5);
  });
});

test.describe("selling landing with payments on", () => {
  test.use({ baseURL: `http://localhost:${PAYWALL_PORT}` });

  test("shows three plans, the year as the best deal, and the payment FAQ", async ({ page }) => {
    await page.goto("/");
    const pricing = page.getByRole("region", { name: "Náhled vždy zdarma. Plný přístup na čas." });
    await expect(pricing).toBeVisible();
    await expect(pricing.getByTestId("plan-trial")).toContainText("1 den zdarma");
    await expect(pricing.getByTestId("plan-14d")).toContainText("14 dní");
    await expect(pricing.getByTestId("plan-year")).toContainText("Nejvýhodnější");
    await expect(pricing).toContainText("automatické obnovení");
    await expect(page.getByRole("region", { name: "Časté otázky" }).getByText("Kolik to stojí?")).toBeVisible();
  });

  test("terms and complaints pages exist and never invent operator data", async ({ page }) => {
    for (const [path, title] of [
      ["/obchodni-podminky", "Obchodní podmínky"],
      ["/reklamace", "Reklamace"],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      await expect(page.locator("main")).toContainText("[DOPLNIT");
    }
    await page.goto("/");
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Obchodní podmínky" })).toBeVisible();
  });
});
