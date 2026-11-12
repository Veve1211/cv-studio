import { expect, test } from "@playwright/test";
import { SAMPLE_CV } from "../src/lib/cv/sample";
import { loadSample } from "./helpers";

const JOB = "Hledáme produktovou designérku do Brna. Požadujeme Figmu, výzkum s uživateli a němčinu na úrovni C1.";

test.describe("tailoring to a job ad", () => {
  test("reorders the CV, shows what the ad wants, and can be reverted", async ({ page }) => {
    await loadSample(page);
    await page.getByTestId("next-tailor").getByRole("button", { name: "Přizpůsobit inzerátu" }).click();
    const dialog = page.getByRole("dialog", { name: "Přizpůsobit inzerátu" });
    await dialog.getByLabel("Text inzerátu").fill(JOB);
    await dialog.getByRole("button", { name: "Přizpůsobit životopis" }).click();
    await expect(dialog).toBeHidden();

    const panel = page.getByTestId("tailor-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("list", { name: "Máš" })).toContainText(SAMPLE_CV.skills[0]);
    await expect(panel.getByRole("list", { name: "Chybí ti" })).toContainText("Němčina na úrovni C1");

    // Mock answer reverses the order: the oldest job is now on top, nothing else changed.
    const last = SAMPLE_CV.experience.at(-1)!;
    await expect(page.locator('#cv-page [data-path="experience.0.company"]')).toHaveText(last.company);
    for (const e of SAMPLE_CV.experience) await expect(page.locator("#cv-page")).toContainText(e.company);

    // The ad is offered again for the cover letter (memory only).
    await panel.getByRole("button", { name: /Napsat dopis k tomuto inzerátu/ }).click();
    const letter = page.getByRole("dialog", { name: "Motivační dopis k inzerátu" });
    await expect(letter.getByLabel("Text inzerátu")).toHaveValue(JOB);
    await letter.getByRole("button", { name: "Zrušit" }).click();

    await panel.getByRole("button", { name: /Vrátit původní pořadí/ }).click();
    await expect(page.getByTestId("tailor-panel")).toHaveCount(0);
    await expect(page.locator('#cv-page [data-path="experience.0.company"]')).toHaveText(SAMPLE_CV.experience[0].company);
  });

  test("an invented summary is underlined by the grounding check", async ({ page }) => {
    await page.route("/api/tailor", (route) =>
      route.fulfill({
        json: {
          tailor: {
            experienceOrder: [0],
            highlightOrder: [],
            skillsOrder: [],
            summary: "Designérka, která v Google zvýšila konverze o 40 %.",
            requirements: [],
          },
        },
      }),
    );
    await page.goto("/#studio");
    await page.getByRole("group", { name: "Vyzkoušej příklad" }).getByRole("button", { name: "Chaotický text" }).click();
    await page.getByRole("button", { name: "Vytvořit životopis" }).filter({ visible: true }).first().click();
    await expect(page.getByTestId("grounding-summary")).toContainText("sedí");
    await page.getByTestId("next-tailor").getByRole("button").click();
    const dialog = page.getByRole("dialog", { name: "Přizpůsobit inzerátu" });
    await dialog.getByLabel("Text inzerátu").fill(JOB);
    await dialog.getByRole("button", { name: "Přizpůsobit životopis" }).click();
    await expect(page.locator('#cv-page [data-path="summary"]')).toHaveAttribute("data-unverified", "");
  });

  test("AI errors stay in the dialog in Czech", async ({ page }) => {
    await page.route("/api/tailor", (route) => route.fulfill({ status: 503, json: { error: "AI je teď přetížená." } }));
    await loadSample(page);
    await page.getByTestId("next-tailor").getByRole("button").click();
    const dialog = page.getByRole("dialog", { name: "Přizpůsobit inzerátu" });
    await dialog.getByLabel("Text inzerátu").fill(JOB);
    await dialog.getByRole("button", { name: "Přizpůsobit životopis" }).click();
    await expect(dialog.getByRole("alert")).toContainText("přetížená");
  });
});
