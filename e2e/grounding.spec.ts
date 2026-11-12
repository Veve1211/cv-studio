import { expect, test, type Page } from "@playwright/test";
import { GROUNDING_FIXTURES } from "../src/lib/cv/grounding.fixtures";
import type { Cv } from "../src/lib/cv/schema";

const fixture = GROUNDING_FIXTURES.find((f) => f.name === "chaotický")!;

async function generateWith(page: Page, input: string, cv: Cv) {
  await page.route("/api/cv", (route) => route.fulfill({ json: { cv } }));
  await page.goto("/");
  await page.getByLabel("Napiš o sobě cokoliv").fill(input);
  await page.getByRole("button", { name: "Vytvořit životopis" }).click();
  await page.locator("#cv-page").waitFor();
}

test.describe("invented facts check", () => {
  test("a faithful CV gets a green confirmation and no underlines", async ({ page }) => {
    await generateWith(page, fixture.input, fixture.faithful);
    await expect(page.getByTestId("grounding-summary")).toContainText("sedí s tvým textem");
    await expect(page.locator("#cv-page [data-unverified]")).toHaveCount(0);
  });

  test("invented facts are underlined with a tooltip, and editing clears them", async ({ page }) => {
    const cv: Cv = structuredClone(fixture.faithful);
    cv.experience[0].company = "Deloitte";
    cv.skills.push("SAP");
    await generateWith(page, fixture.input, cv);

    await expect(page.getByTestId("grounding-summary")).toContainText("2 údaje jsme v tvém textu nenašli");
    const company = page.locator('#cv-page [data-path="experience.0.company"]');
    await expect(company).toHaveAttribute("data-unverified", "");
    await expect(company).toHaveAttribute("title", /Tohle v tvém textu nebylo, zkontroluj/);
    await expect(company).toHaveCSS("text-decoration-style", "wavy");
    await expect(page.locator(`#cv-page [data-path="skills.${cv.skills.length - 1}"]`)).toHaveAttribute("data-unverified", "");

    // The user's own correction is trusted.
    await company.click();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await page.keyboard.type("Ocel a.s.");
    await page.keyboard.press("Enter");
    await expect(page.locator('#cv-page [data-path="experience.0.company"]')).not.toHaveAttribute("data-unverified");
    await expect(page.getByTestId("grounding-summary")).toContainText("1 údaj jsme v tvém textu nenašli");
  });

  test("underlines never reach the PDF", async ({ page, isMobile }) => {
    test.skip(isMobile, "page.pdf() is viewport independent");
    const cv: Cv = structuredClone(fixture.faithful);
    cv.experience[0].company = "Deloitte";
    await generateWith(page, fixture.input, cv);
    await page.emulateMedia({ media: "print" });
    await expect(page.locator('#cv-page [data-path="experience.0.company"]')).toHaveCSS("text-decoration-line", "none");
  });

  test("the sample has nothing to compare and shows no check", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ukázka" }).click();
    await page.locator("#cv-page").waitFor();
    await expect(page.getByTestId("grounding-summary")).toHaveCount(0);
  });
});
