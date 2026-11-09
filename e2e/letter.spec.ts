import { expect, test, type Page } from "@playwright/test";
import { PAYWALL_PORT } from "../playwright.config";
import { MOCK_LETTER } from "../src/lib/letter/generate";
import { SAMPLE_CV } from "../src/lib/cv/sample";
import { loadSample, pickRadio } from "./helpers";
import { pdfPages, squash } from "./pdf";

const JOB = "Hledáme produktovou designérku do týmu v Brně. Požadujeme Figmu a zkušenost s výzkumem.";

async function writeLetter(page: Page) {
  await loadSample(page);
  await page.getByRole("button", { name: /Napsat motivační dopis/ }).click();
  const dialog = page.getByRole("dialog", { name: "Motivační dopis k inzerátu" });
  await dialog.getByLabel("Text inzerátu").fill(JOB);
  await dialog.getByRole("button", { name: "Napsat motivační dopis" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("#cv-page [data-letter]")).toBeVisible();
}

test.describe("cover letter", () => {
  test("asks for the job ad and writes a letter in the CV's look", async ({ page }) => {
    await loadSample(page);
    await page.getByRole("button", { name: /Napsat motivační dopis/ }).click();
    const dialog = page.getByRole("dialog", { name: "Motivační dopis k inzerátu" });
    await dialog.getByLabel("Text inzerátu").fill("krátké");
    await dialog.getByRole("button", { name: "Napsat motivační dopis" }).click();
    await expect(dialog.getByRole("alert")).toContainText("text inzerátu");
    await dialog.getByLabel("Text inzerátu").fill(JOB);
    await dialog.getByRole("button", { name: "Napsat motivační dopis" }).click();

    const page1 = page.locator("#cv-page");
    await expect(page.getByRole("tab", { name: "Motivační dopis" })).toHaveAttribute("aria-selected", "true");
    await expect(page1).toContainText(MOCK_LETTER.paragraphs[0].slice(0, 30));
    await expect(page1).toContainText("Tereza Nováková");
    await expect(page1).toContainText("S pozdravem");
    await expect(page1).toContainText("Brno, ");

    await page.getByRole("tab", { name: "Životopis" }).click();
    await expect(page1.locator("[data-letter]")).toHaveCount(0);
    await expect(page1).toContainText("Masarykova univerzita");
  });

  test("follows the chosen template and can be edited", async ({ page }) => {
    await writeLetter(page);
    await pickRadio(page, "Blok");
    await expect(page.locator("#cv-page")).toHaveAttribute("data-template", "block");
    await expect(page.locator("#cv-page [data-letter]")).toBeVisible();

    const p0 = page.locator('#cv-page [data-path="paragraphs.0"]');
    await p0.click();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await page.keyboard.type("Ráda bych se přidala k vašemu týmu.");
    await page.keyboard.press("Enter");
    await expect(page.locator('#cv-page [data-path="paragraphs.0"]')).toHaveText("Ráda bych se přidala k vašemu týmu.");
    // CV-only actions are hidden while the letter is shown
    await expect(page.getByRole("button", { name: /Vylepšit shrnutí/ })).toHaveCount(0);
  });

  test("invented facts in the letter are underlined", async ({ page }) => {
    await page.route("/api/letter", (route) =>
      route.fulfill({ json: { letter: { ...MOCK_LETTER, paragraphs: ["V Helios Group jsem zvýšila prodeje o 45 %."] } } }),
    );
    await writeLetter(page);
    await expect(page.locator('#cv-page [data-path="paragraphs.0"]')).toHaveAttribute("data-unverified", "");
    await expect(page.getByTestId("grounding-summary")).toContainText("1 údaj");
  });

  test("prints as a one-page PDF named after the letter (no paywall)", async ({ page, isMobile }) => {
    test.skip(isMobile, "page.pdf() is viewport independent");
    await writeLetter(page);
    await page.evaluate(() => {
      window.print = () => {
        (window as unknown as { __title?: string }).__title = document.title;
      };
    });
    await page.getByRole("button", { name: "Stáhnout PDF" }).click();
    expect(await page.evaluate(() => (window as unknown as { __title?: string }).__title)).toBe("Motivacni-dopis-Tereza-Novakova");
    const pages = await pdfPages(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
    expect(pages).toHaveLength(1);
    expect(pages[0]).toContain(squash("S pozdravem"));
    expect(pages[0]).not.toContain(squash("Masarykova univerzita"));
  });
});

test.describe("cover letter with the paywall", () => {
  test.use({ baseURL: `http://localhost:${PAYWALL_PORT}` });
  test.skip(({ isMobile }) => isMobile, "server rendering does not depend on the viewport");

  test("the server renders the letter after payment", async ({ request }) => {
    const res = await request.post("/api/pdf", {
      data: {
        sessionId: "cs_test_mock",
        cv: SAMPLE_CV,
        templateId: "magazine",
        accentId: "sky",
        letter: { ...MOCK_LETTER, dateLine: "Brno, 9. 11. 2026" },
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-disposition"]).toContain("Motivacni-dopis-Tereza-Novakova.pdf");
    const pages = await pdfPages(await res.body());
    expect(pages).toHaveLength(1);
    expect(pages[0]).toContain(squash("S pozdravem"));
    expect(pages[0]).toContain(squash("Brno, 9. 11. 2026"));
  });
});
