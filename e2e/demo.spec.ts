import { expect, test, type Page } from "@playwright/test";
import { PAYWALL_PORT } from "../playwright.config";
import { CHAOS_CV } from "../src/lib/cv/examples";
import { pickRadio } from "./helpers";
import { pdfPages, squash } from "./pdf";

const PAID = `http://localhost:${PAYWALL_PORT}`;
const JOB = "Hledáme marketingovou specialistku do Brna. Náplň: sociální sítě, Instagram, Canva. Nabízíme stabilní tým.";

/** The visible one of duplicated buttons (form vs. phone bottom bar). */
const button = (page: Page, name: string | RegExp) => page.getByRole("button", { name }).filter({ visible: true }).first();

test.describe("presentation mode", () => {
  test("full scenario: messy text → CV → 3 templates → letter → PDF, all unlocked", async ({ page, isMobile }) => {
    await page.goto(`${PAID}/?demo=1#studio`);
    await expect(page.getByTestId("demo-badge")).toContainText("Prezentační režim");
    expect(page.url()).not.toContain("demo=1");

    await page.getByRole("group", { name: "Vyzkoušej příklad" }).getByRole("button", { name: "Chaotický text" }).click();
    await expect(page.getByLabel("Napiš o sobě cokoliv")).toHaveValue(/petra dvorakova/);
    await button(page, "Vytvořit životopis").click();

    const cvPage = page.locator("#cv-page");
    await expect(cvPage).toContainText(CHAOS_CV.name);
    await expect(cvPage).toContainText("Kavárna Spolek");
    // Unlocked: no watermark, and the grounding check is happy with a faithful CV.
    await expect(cvPage).not.toHaveAttribute("data-watermark");
    await expect(page.getByTestId("grounding-summary")).toContainText("sedí s tvým textem");

    for (const [name, id] of [
      ["Časová osa", "timeline"],
      ["Blok", "block"],
      ["Minimal", "minimal"],
    ] as const) {
      await pickRadio(page, name);
      await expect(cvPage).toHaveAttribute("data-template", id);
      await expect(cvPage).toContainText(CHAOS_CV.name);
    }

    await button(page, /Napsat motivační dopis/).click();
    const dialog = page.getByRole("dialog", { name: "Motivační dopis k inzerátu" });
    await dialog.getByLabel("Text inzerátu").fill(JOB);
    await dialog.getByRole("button", { name: "Napsat motivační dopis" }).click();
    await expect(dialog).toBeHidden();
    await expect(cvPage.locator("[data-letter]")).toBeVisible();
    await page.getByRole("tab", { name: "Životopis" }).click();

    // PDF: no paywall dialog, straight to the browser's "Save as PDF".
    await page.evaluate(() => {
      window.print = () => {
        (window as unknown as { __printed?: string }).__printed = document.title;
      };
    });
    await button(page, "Stáhnout PDF").click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __printed?: string }).__printed)).toBe(
      "Zivotopis-Petra-Dvorakova",
    );
    if (!isMobile) {
      const pages = await pdfPages(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
      expect(pages).toHaveLength(1);
      expect(pages[0]).toContain(squash("Petra Dvořáková"));
    }
  });

  test("the unlock is per browser and server-checked", async ({ page, browser }) => {
    await page.goto(`${PAID}/?demo=1`);
    await expect(page.getByTestId("demo-badge")).toBeVisible();
    const config = await page.evaluate(() => fetch("/api/checkout").then((r) => r.json()));
    expect(config.enabled).toBe(false);
    expect(config.demoUntil).toBeGreaterThan(Date.now() / 1000 + 2.9 * 3600);

    // Another browser (no cookie) still sees the paywall.
    const other = await browser.newContext();
    const res = await other.request.get(`${PAID}/api/checkout`);
    expect((await res.json()).enabled).toBe(true);
    // A forged cookie does not unlock anything.
    const forged = await other.request.get(`${PAID}/api/checkout`, {
      headers: { cookie: `cvk_demo=${Math.floor(Date.now() / 1000) + 3600}.forged` },
    });
    expect((await forged.json()).enabled).toBe(true);
    await other.close();
  });

  test("tells the presenter when DEMO_ENABLED is missing", async ({ page }) => {
    await page.goto("/?demo=1#studio");
    await expect(page.getByRole("alert").filter({ hasText: "DEMO_ENABLED" })).toBeVisible();
    await expect(page.getByTestId("demo-badge")).toHaveCount(0);
  });
});

test.describe("when the AI fails", () => {
  test("shows a clear Czech message and a retry button", async ({ page }) => {
    let fail = true;
    await page.route("/api/cv", (route) =>
      fail
        ? route.fulfill({ status: 503, json: { error: "AI je teď přetížená. Zkus to prosím za chvíli." } })
        : route.continue(),
    );
    await page.goto("/#studio");
    await page.getByRole("group", { name: "Vyzkoušej příklad" }).getByRole("button", { name: "Chaotický text" }).click();
    await button(page, "Vytvořit životopis").click();
    const alert = page.getByRole("alert").filter({ hasText: "přetížená" });
    await expect(alert).toBeVisible();
    fail = false;
    await alert.getByRole("button", { name: "Zkusit znovu" }).click();
    await expect(page.locator("#cv-page")).toContainText(CHAOS_CV.name);
  });

  test("survives a dropped connection", async ({ page }) => {
    await page.route("/api/cv", (route) => route.abort("connectionreset"));
    await page.goto("/#studio");
    await page.getByRole("group", { name: "Vyzkoušej příklad" }).getByRole("button", { name: "Chaotický text" }).click();
    await button(page, "Vytvořit životopis").click();
    await expect(page.getByRole("alert").filter({ hasText: "Nepodařilo se spojit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zkusit znovu" })).toBeVisible();
  });
});
