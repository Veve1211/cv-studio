import { expect, test } from "@playwright/test";
import { EXAMPLES } from "../src/lib/cv/examples";
import { loadSample } from "./helpers";

test.describe("guide and empty states", () => {
  test("example chips fill the text field and the user's text can be restored", async ({ page }) => {
    await page.goto("/#studio");
    const field = page.getByLabel("Napiš o sobě cokoliv");
    const group = page.getByRole("group", { name: "Vyzkoušej příklad" });
    for (const example of EXAMPLES) {
      await group.getByRole("button", { name: example.label }).click();
      await expect(field).toHaveValue(example.text);
    }
    // No "restore" when only examples were replaced.
    await expect(page.getByRole("button", { name: "↩ Vrátit můj text" })).toHaveCount(0);

    await field.fill("Můj vlastní text o mně a mé práci.");
    await group.getByRole("button", { name: "Absolventka" }).click();
    await expect(field).toHaveValue(EXAMPLES[0].text);
    await page.getByRole("button", { name: "↩ Vrátit můj text" }).click();
    await expect(field).toHaveValue("Můj vlastní text o mně a mé práci.");
  });

  test("loading shows three steps in order", async ({ page }) => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    await page.route("/api/cv", async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto("/#studio");
    await page.getByRole("group", { name: "Vyzkoušej příklad" }).getByRole("button", { name: "Změna oboru" }).click();
    await page.getByRole("button", { name: "Vytvořit životopis" }).click();
    const steps = page.getByRole("list", { name: "Postup" }).getByRole("listitem");
    await expect(steps).toHaveText([/Čtu tvůj text/, /Hledám praxi a vzdělání/, /Skládám životopis/]);
    await expect(steps.first()).toHaveAttribute("data-state", "active");
    await expect(steps.nth(1)).toHaveAttribute("data-state", "active", { timeout: 5000 });
    await expect(steps.first()).toHaveAttribute("data-state", "done");
    release();
    await expect(page.locator("#cv-page")).toBeVisible();
  });

  test("edit hint appears after creating and disappears after the first click", async ({ page }) => {
    await loadSample(page);
    const hint = page.getByRole("note").filter({ hasText: "Klikni do textu a přepiš ho" });
    await expect(hint).toBeVisible();
    await page.locator('#cv-page [data-path="name"]').click();
    await expect(hint).toHaveCount(0);
    // It does not come back when switching templates.
    await page.locator("label").filter({ has: page.getByRole("radio", { name: "Blok", exact: true }) }).click();
    await expect(hint).toHaveCount(0);
  });
});
