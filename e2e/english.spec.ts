import { expect, test } from "@playwright/test";
import { SAMPLE_CV } from "../src/lib/cv/sample";
import { MOCK_EN_LETTER, MOCK_EN_SUMMARY } from "../src/lib/translate/translate";
import { loadSample } from "./helpers";

const JOB = "Hledáme produktovou designérku do týmu v Brně. Požadujeme Figmu a zkušenost s výzkumem.";

test.describe("English version", () => {
  test("CZ / EN switch translates once, then switches without calling the AI", async ({ page }) => {
    let calls = 0;
    await page.route("/api/translate", (route) => {
      calls += 1;
      return route.continue();
    });
    await loadSample(page);
    const cvPage = page.locator("#cv-page");
    await expect(cvPage).toContainText("Praxe");

    await page.getByRole("button", { name: "Anglicky" }).click();
    await expect(cvPage).toContainText(MOCK_EN_SUMMARY.slice(0, 30));
    await expect(cvPage).toContainText(/Experience/i);
    // Names and companies stay untouched.
    await expect(cvPage).toContainText(SAMPLE_CV.name);
    await expect(cvPage).toContainText(SAMPLE_CV.experience[0].company);
    await expect(page.getByTestId("grounding-summary")).toContainText("sedí");

    await page.getByRole("button", { name: "Česky" }).click();
    await expect(cvPage).toContainText("Praxe");
    await page.getByRole("button", { name: "Anglicky" }).click();
    await expect(cvPage).toContainText(/Experience/i);
    expect(calls).toBe(1);
  });

  test("the cover letter is translated too and prints as Cover-letter", async ({ page, isMobile }) => {
    await loadSample(page);
    await page.getByTestId("next-letter").getByRole("button").click();
    const dialog = page.getByRole("dialog", { name: "Motivační dopis k inzerátu" });
    await dialog.getByLabel("Text inzerátu").fill(JOB);
    await dialog.getByRole("button", { name: "Napsat motivační dopis" }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Anglicky" }).click();
    await expect(page.locator("#cv-page [data-letter]")).toContainText(MOCK_EN_LETTER.greeting);
    test.skip(isMobile, "the download button lives in the bottom bar on phones");
    await page.evaluate(() => {
      window.print = () => {
        (window as unknown as { __t?: string }).__t = document.title;
      };
    });
    await page.getByRole("button", { name: "Stáhnout PDF" }).click();
    expect(await page.evaluate(() => (window as unknown as { __t?: string }).__t)).toBe("Cover-letter-Tereza-Novakova");
  });

  test("a changed number in the translation is underlined", async ({ page }) => {
    await page.route("/api/translate", (route) =>
      route.fulfill({ json: { cv: { ...SAMPLE_CV, summary: "Designer with 12 years of experience." }, letter: null } }),
    );
    await loadSample(page);
    await page.getByRole("button", { name: "Anglicky" }).click();
    await expect(page.locator('#cv-page [data-path="summary"]')).toHaveAttribute("data-unverified", "");
  });

  test("a stale translation offers to translate again", async ({ page }) => {
    await loadSample(page);
    await page.getByRole("button", { name: "Anglicky" }).click();
    await expect(page.locator("#cv-page")).toContainText(MOCK_EN_SUMMARY.slice(0, 30));
    await page.getByRole("button", { name: "Česky" }).click();
    const name = page.locator('#cv-page [data-path="headline"]').first();
    await name.click();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await page.keyboard.type("Designérka");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Anglicky" }).click();
    await expect(page.getByRole("button", { name: "Přeložit znovu" })).toBeVisible();
  });
});
