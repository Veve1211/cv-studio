import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { SAMPLE_CV } from "../src/lib/cv/sample";
import { PAYWALL_PORT } from "../playwright.config";
import { loadSample, pickRadio } from "./helpers";
import { pdfPages, squash } from "./pdf";

// Count print() calls instead of opening the real dialog (survives reloads/redirects).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {
      const w = window as unknown as { __prints?: number };
      w.__prints = (w.__prints ?? 0) + 1;
    };
  });
});
const prints = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as unknown as { __prints?: number }).__prints ?? 0);

test.describe("without a Stripe key", () => {
  test("PDF is free and nothing mentions payment", async ({ page }) => {
    await loadSample(page);
    await page.getByRole("button", { name: "Stáhnout PDF" }).click();
    expect(await prints(page)).toBe(1);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("Kč");
    expect(await page.evaluate(() => document.documentElement.dataset.paywall)).toBeUndefined();
  });
});

test.describe("with a Stripe key (test mode)", () => {
  test.use({ baseURL: `http://localhost:${PAYWALL_PORT}` });

  test("asks for payment, then restores the CV and unlocks PDF after checkout", async ({ page }) => {
    await loadSample(page);
    await pickRadio(page, "Blok");
    await pickRadio(page, "Kobaltová");
    const name = page.locator('#cv-page [data-path="name"]');
    await name.click();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await page.keyboard.type("Tereza Upravená");
    await page.keyboard.press("Enter");

    await page.getByRole("button", { name: "Stáhnout PDF" }).click();
    const dialog = page.getByRole("dialog", { name: "Stáhnout PDF za 99 Kč" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("4242 4242 4242 4242");
    expect(await prints(page)).toBe(0);

    // The fake checkout redirects straight back as "paid".
    await dialog.getByRole("button", { name: "Zaplatit 99 Kč" }).click();
    await page.waitForURL((url) => url.pathname === "/" && !url.search);
    await expect(page.getByRole("status").filter({ hasText: "Zaplaceno" })).toBeVisible();
    await expect(page.locator("#cv-page")).toHaveAttribute("data-template", "block");
    await expect(page.locator('#cv-page [data-path="name"]')).toHaveText("Tereza Upravená");
    await expect(page.getByRole("radio", { name: "Kobaltová" })).toBeChecked();
    expect(await page.evaluate(() => sessionStorage.getItem("cvecko:checkout"))).toBeNull();

    // Paid: a clean PDF comes from the server (no print dialog, no watermark).
    await expect(page.locator("#cv-page")).not.toHaveAttribute("data-watermark");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Stáhnout PDF" }).first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("Zivotopis-Tereza-Upravena.pdf");
    expect(await prints(page)).toBe(0);
    const pages = await pdfPages(readFileSync(await download.path()));
    expect(pages).toHaveLength(1);
    expect(pages[0]).toContain(squash("Tereza Upravená"));
    expect(pages[0]).not.toContain(squash("NÁHLED"));
  });

  test("the unpaid preview carries a watermark", async ({ page }) => {
    await loadSample(page);
    await expect(page.locator("#cv-page")).toHaveAttribute("data-watermark", "");
  });

  test("the internal print page is not reachable from outside", async ({ request }) => {
    const res = await request.get("/tisk");
    expect(res.status()).toBe(404);
    const forged = await request.get("/tisk", { headers: { "x-cvecko-print": "0".repeat(64) } });
    expect(forged.status()).toBe(404);
  });

  test("the PDF API refuses unpaid sessions", async ({ request }) => {
    const res = await request.post("/api/pdf", {
      data: { sessionId: "cs_test_forged", cv: SAMPLE_CV, templateId: "minimal", accentId: "sky" },
    });
    expect(res.status()).toBe(402);
  });

  test("Ctrl+P does not bypass the paywall", async ({ page, isMobile }) => {
    test.skip(isMobile, "page.pdf() is viewport independent");
    await loadSample(page);
    await expect(page.locator("html")).toHaveAttribute("data-paywall", "locked");
    const [text] = await pdfPages(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
    expect(text).toContain(squash("po zaplacení"));
    expect(text).not.toContain(squash("Tereza Nováková"));
  });

  test("cancelled checkout keeps the CV", async ({ page }) => {
    await loadSample(page);
    await page.getByRole("button", { name: "Stáhnout PDF" }).click();
    // Simulate leaving to Stripe and coming back via the cancel URL.
    await page.evaluate(() =>
      sessionStorage.setItem(
        "cvecko:checkout",
        JSON.stringify({ cv: { name: "Jana Zrušená", headline: "", contact: { email: "", phone: "", location: "", web: "" }, summary: "", experience: [], education: [], skills: ["Excel"], languages: [] }, templateId: "minimal", accentId: "plum" }),
      ),
    );
    await page.goto("/?checkout=cancel");
    await expect(page.getByRole("status").filter({ hasText: "zrušena" })).toBeVisible();
    await expect(page.locator('#cv-page [data-path="name"]')).toHaveText("Jana Zrušená");
    await expect(page.locator("#cv-page")).toHaveAttribute("data-template", "minimal");
  });

  test("a forged session id does not unlock the PDF", async ({ page, request }) => {
    const res = await request.post("/api/checkout/verify", { data: { sessionId: "cs_test_forged" } });
    expect(await res.json()).toEqual({ paid: false });
    await page.goto("/?checkout=success&session_id=cs_test_forged");
    await page.getByRole("button", { name: "Ukázka" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-paywall", "locked");
    await page.getByRole("button", { name: "Stáhnout PDF" }).click();
    await expect(page.getByRole("dialog", { name: "Stáhnout PDF za 99 Kč" })).toBeVisible();
    expect(await prints(page)).toBe(0);
  });
});
