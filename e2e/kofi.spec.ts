import { expect, test } from "@playwright/test";
import { PAYWALL_PORT } from "../playwright.config";
import { loadSample } from "./helpers";

const KOFI = "https://ko-fi.com/cvecko-example";

test.describe("Ko-fi tip link", () => {
  test("hidden without KOFI_URL", async ({ page }) => {
    await loadSample(page);
    await expect(page.getByRole("link", { name: /Kup mi kafe/ })).toHaveCount(0);
  });

  test("footer button and a gentle note after the PDF, new tab, no scripts", async ({ page }) => {
    await page.addInitScript(() => {
      window.print = () => {};
    });
    await page.goto(`http://localhost:${PAYWALL_PORT}/?demo=1#studio`);
    await expect(page.getByTestId("demo-badge")).toBeVisible();

    const footerLink = page.getByRole("contentinfo").getByRole("link", { name: /Kup mi kafe ☕/ });
    await expect(footerLink).toHaveAttribute("href", KOFI);
    await expect(footerLink).toHaveAttribute("target", "_blank");
    await expect(footerLink).toHaveAttribute("rel", /noopener/);

    await page.getByRole("button", { name: "Ukázka" }).click();
    await expect(page.getByTestId("kofi-note")).toHaveCount(0);
    await page.getByRole("button", { name: "Stáhnout PDF" }).filter({ visible: true }).first().click();
    await expect(page.getByTestId("kofi-note")).toContainText("Pomohlo ti Cvéčko?");
    await expect(page.getByTestId("kofi-note").getByRole("link")).toHaveAttribute("href", KOFI);

    const external = await page.locator("script[src]").evaluateAll((els) =>
      els.map((e) => (e as HTMLScriptElement).src).filter((src) => !src.startsWith(location.origin)),
    );
    expect(external).toEqual([]);
  });
});
