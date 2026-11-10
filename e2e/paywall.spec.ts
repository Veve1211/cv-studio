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

const JOB = "Hledáme produktovou designérku do týmu v Brně. Požadujeme Figmu a zkušenost s výzkumem.";

test.describe("with a Stripe key (test mode)", () => {
  test.use({ baseURL: `http://localhost:${PAYWALL_PORT}` });

  test("offers access, then restores the CV and unlocks everything after checkout", async ({ page }) => {
    await loadSample(page);
    await pickRadio(page, "Blok");
    await pickRadio(page, "Kobaltová");
    const name = page.locator('#cv-page [data-path="name"]');
    await name.click();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await page.keyboard.type("Tereza Upravená");
    await page.keyboard.press("Enter");

    await page.getByRole("button", { name: "Stáhnout PDF" }).filter({ visible: true }).first().click();
    const dialog = page.getByRole("dialog", { name: "Odemkni plný přístup" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("4242 4242 4242 4242");
    expect(await prints(page)).toBe(0);

    // Consent with the terms and with starting right away is required before paying.
    await dialog.getByLabel(/14 dní/).check();
    const pay = dialog.getByRole("button", { name: "Zaplatit 99 Kč" });
    const hint = dialog.getByText("Pro pokračování zaškrtni oba souhlasy.");
    await expect(pay).toBeDisabled();
    await expect(hint).toBeVisible();
    await expect(pay).toHaveAccessibleDescription("Pro pokračování zaškrtni oba souhlasy.");
    await dialog.getByLabel(/obchodními podmínkami/).check();
    await expect(pay).toBeDisabled();
    await expect(hint).toBeVisible();
    await dialog.getByLabel(/přístup začal hned/).check();
    await expect(hint).toBeHidden();
    await expect(pay).toBeEnabled();

    // The fake checkout redirects straight back as "paid".
    await pay.click();
    await page.waitForURL((url) => url.pathname === "/" && !url.search);
    await expect(page.getByRole("status").filter({ hasText: "Zaplaceno" })).toContainText("Kód pro jiné zařízení: CV-");
    await expect(page.locator("#cv-page")).toHaveAttribute("data-template", "block");
    await expect(page.locator('#cv-page [data-path="name"]')).toHaveText("Tereza Upravená");
    await expect(page.getByRole("radio", { name: "Kobaltová" })).toBeChecked();
    expect(await page.evaluate(() => sessionStorage.getItem("cvecko:checkout"))).toBeNull();
    await expect(page.locator("#cv-page")).not.toHaveAttribute("data-watermark");

    // Access survives a reload (HttpOnly cookie), the badge shows the code.
    await page.reload();
    await page.getByRole("button", { name: "Ukázka" }).click();
    await expect(page.getByTestId("access-badge")).toContainText("Plný přístup do");
    await expect(page.locator("#cv-page")).not.toHaveAttribute("data-watermark");
  });

  test("with access the clean PDF comes from the server", async ({ page, isMobile }) => {
    test.skip(isMobile, "the download button lives in the bottom bar on phones");
    expect((await page.request.post("/api/access/trial")).status()).toBe(200);
    await loadSample(page);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Stáhnout PDF" }).first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("Zivotopis-Tereza-Novakova.pdf");
    expect(await prints(page)).toBe(0);
    const pages = await pdfPages(readFileSync(await download.path()));
    expect(pages).toHaveLength(1);
    expect(pages[0]).toContain(squash("Tereza Nováková"));
    expect(pages[0]).not.toContain(squash("NÁHLED"));
  });

  test("one free day per browser, offered when a paid feature is clicked", async ({ page }) => {
    await loadSample(page);
    await page.getByTestId("next-letter").getByRole("button").click();
    const dialog = page.getByRole("dialog", { name: "Odemkni plný přístup" });
    await expect(dialog).toContainText("Motivační dopis je součástí plného přístupu");
    await dialog.getByRole("button", { name: /Vyzkoušet 1 den zdarma/ }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("access-badge")).toContainText("CV-");

    await page.getByTestId("next-letter").getByRole("button").click();
    const letter = page.getByRole("dialog", { name: "Motivační dopis k inzerátu" });
    await letter.getByLabel("Text inzerátu").fill(JOB);
    await letter.getByRole("button", { name: "Napsat motivační dopis" }).click();
    await expect(page.locator("#cv-page [data-letter]")).toBeVisible();

    // The free day cannot be taken again in the same browser.
    const again = await page.request.post("/api/access/trial");
    expect(again.status()).toBe(409);
  });

  test("the code unlocks another device", async ({ page, browser }) => {
    const other = await browser.newContext();
    const trial = await other.request.post(`http://localhost:${PAYWALL_PORT}/api/access/trial`);
    const { code } = (await trial.json()) as { code: string };
    await other.close();

    await loadSample(page);
    await page.getByRole("button", { name: "Stáhnout PDF" }).filter({ visible: true }).first().click();
    const dialog = page.getByRole("dialog", { name: "Odemkni plný přístup" });
    await dialog.getByText("Mám kód").click();
    await dialog.getByLabel("Přístupový kód").fill("CV-NEPLATNY-AAAAAAAA");
    await dialog.getByRole("button", { name: "Použít kód" }).click();
    await expect(dialog.getByRole("alert")).toContainText("neplatí");
    await dialog.getByLabel("Přístupový kód").fill(code.toLowerCase());
    await dialog.getByRole("button", { name: "Použít kód" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("access-badge")).toContainText(code);
  });

  test("paid features are checked on the server", async ({ request }) => {
    const cv = SAMPLE_CV;
    expect((await request.post("/api/letter", { data: { cv, job: JOB } })).status()).toBe(402);
    expect((await request.post("/api/tailor", { data: { cv, job: JOB } })).status()).toBe(402);
    expect((await request.post("/api/translate", { data: { cv } })).status()).toBe(402);
    expect(
      (await request.post("/api/pdf", { data: { cv, templateId: "minimal", accentId: "sky" } })).status(),
    ).toBe(402);
    // A forged access cookie does not help.
    const forged = await request.post("/api/letter", {
      data: { cv, job: JOB },
      headers: { cookie: `cvk_access=${Math.floor(Date.now() / 1000) + 3600}.forged` },
    });
    expect(forged.status()).toBe(402);
    // The free CV preview stays free.
    expect((await request.post("/api/cv", { data: { text: "Jsem Jana, 4 roky účetní v Ocel a.s., umím Excel." } })).status()).toBe(200);
  });

  test("checkout needs both consents on the server too", async ({ request }) => {
    const res = await request.post("/api/checkout", { data: { plan: "year", terms: true } });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toContain("zahájením plnění");
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

  test("a forged session id does not unlock anything", async ({ page, request }) => {
    const res = await request.post("/api/checkout/verify", { data: { sessionId: "cs_test_forged" } });
    expect(await res.json()).toEqual({ paid: false });
    await page.goto("/?checkout=success&session_id=cs_test_forged");
    await page.getByRole("button", { name: "Ukázka" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-paywall", "locked");
    await page.getByRole("button", { name: "Stáhnout PDF" }).filter({ visible: true }).first().click();
    await expect(page.getByRole("dialog", { name: "Odemkni plný přístup" })).toBeVisible();
    expect(await prints(page)).toBe(0);
  });
});
