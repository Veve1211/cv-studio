import { expect, test } from "@playwright/test";
import { loadSample, openMore } from "./helpers";

const SELECT_ALL = process.platform === "darwin" ? "Meta+A" : "Control+A";

test.describe("editing in the preview", () => {
  test("clicking text lets you rewrite it, Zpět undoes it", async ({ page }) => {
    await loadSample(page);
    const name = page.locator('#cv-page [data-path="name"]');
    await name.click();
    await page.keyboard.press(SELECT_ALL);
    await page.keyboard.type("Tereza Svobodová");
    await page.keyboard.press("Enter");
    await expect(name).toHaveText("Tereza Svobodová");
    await expect(name).not.toBeFocused();

    await openMore(page);

    await page.getByRole("button", { name: "Zpět" }).click();
    await expect(page.locator('#cv-page [data-path="name"]')).toHaveText("Tereza Nováková");
    await openMore(page);
    await expect(page.getByRole("button", { name: "Zpět" })).toBeDisabled();
  });

  test("edits survive switching templates", async ({ page }) => {
    await loadSample(page);
    const role = page.locator('#cv-page [data-path="experience.0.role"]');
    await role.click();
    await page.keyboard.press(SELECT_ALL);
    await page.keyboard.type("Vedoucí designu");
    await role.blur();
    await page.locator("label").filter({ has: page.getByRole("radio", { name: "Blok", exact: true }) }).click();
    await expect(page.locator("#cv-page")).toHaveAttribute("data-template", "block");
    await expect(page.locator("#cv-page")).toContainText("Vedoucí designu");
  });

  test("Escape cancels an edit", async ({ page }) => {
    await loadSample(page);
    const name = page.locator('#cv-page [data-path="name"]');
    await name.click();
    await page.keyboard.press(SELECT_ALL);
    await page.keyboard.type("Něco jiného");
    await page.keyboard.press("Escape");
    await expect(name).toHaveText("Tereza Nováková");
    await openMore(page);
    await expect(page.getByRole("button", { name: "Zpět" })).toBeDisabled();
  });

  test("typed HTML stays plain text", async ({ page }) => {
    await loadSample(page);
    let dialog = false;
    page.on("dialog", (d) => {
      dialog = true;
      void d.dismiss();
    });
    const headline = page.locator('#cv-page [data-path="headline"]').first();
    await headline.click();
    await page.keyboard.press(SELECT_ALL);
    await page.keyboard.type('<img src=x onerror="alert(1)">');
    await page.keyboard.press("Enter");
    await expect(page.locator('#cv-page [data-path="headline"]').first()).toHaveText('<img src=x onerror="alert(1)">');
    await expect(page.locator("#cv-page img")).toHaveCount(0);
    expect(dialog).toBe(false);
  });

  test("Vylepšit shrnutí replaces the summary via AI", async ({ page }) => {
    await loadSample(page);
    await openMore(page);
    await page.getByRole("button", { name: /Vylepšit shrnutí/ }).click();
    await expect(page.locator('#cv-page [data-path="summary"]')).toContainText("staví na výzkumu s uživateli");
    await expect(page.getByRole("status").filter({ hasText: "Shrnutí je vylepšené" })).toBeVisible();
    await openMore(page);
    await page.getByRole("button", { name: "Zpět" }).click();
    await expect(page.locator('#cv-page [data-path="summary"]')).toContainText("Propojuje výzkum");
  });

  test("summary errors are shown in Czech", async ({ page }) => {
    await page.route("/api/summary", (route) => route.fulfill({ status: 503, json: { error: "AI je teď přetížená." } }));
    await loadSample(page);
    await openMore(page);
    await page.getByRole("button", { name: /Vylepšit shrnutí/ }).click();
    await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toContainText("přetížená");
  });
});
