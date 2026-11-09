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
    await expect(page.getByRole("region", { name: /PDF za 99 Kč/ })).toHaveCount(0);

    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faqLd = ld.map((t) => JSON.parse(t)).find((d) => d["@type"] === "FAQPage");
    expect(faqLd.mainEntity.length).toBe(5);
  });
});

test.describe("selling landing with payments on", () => {
  test.use({ baseURL: `http://localhost:${PAYWALL_PORT}` });

  test("shows the price and the payment FAQ", async ({ page }) => {
    await page.goto("/");
    const pricing = page.getByRole("region", { name: "Náhled zdarma. PDF za 99 Kč." });
    await expect(pricing).toBeVisible();
    await expect(pricing).toContainText("jednorázově");
    await expect(pricing).toContainText("žádné předplatné");
    await expect(page.getByRole("region", { name: "Časté otázky" }).getByText("Kolik to stojí?")).toBeVisible();
  });
});
