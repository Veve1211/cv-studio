import { expect, test } from "@playwright/test";
import { CLIENT_TIMEOUT_MS, TIMEOUT_MESSAGE } from "../src/lib/client-api";
import { loadSample } from "./helpers";

const JOB = "Hledáme produktovou designérku do týmu v Brně. Požadujeme Figmu a zkušenost s výzkumem.";
const PAGE_WITH_CLUTTER = `Přejít na záhlaví
Nabídky práce
Přihlásit se
${JOB}
Zpětná vazba
Používáme cookies.
© 2026 Pracovní portál s.r.o. Všechna práva vyhrazena.`;

test.describe("AI never keeps you waiting forever", () => {
  test("the cover letter gives up with a Czech message, a retry button and working buttons", async ({ page }) => {
    await page.clock.install();
    let calls = 0;
    await page.route("/api/letter", (route) => {
      calls += 1;
      // First answer gets lost; the retry works.
      return calls === 1 ? new Promise(() => {}) : route.continue();
    });
    await loadSample(page);
    await page.getByTestId("next-letter").getByRole("button").click();
    const dialog = page.getByRole("dialog", { name: "Motivační dopis k inzerátu" });
    await dialog.getByLabel("Text inzerátu").fill(JOB);
    await dialog.getByRole("button", { name: "Napsat motivační dopis" }).click();
    await expect(dialog.getByRole("button", { name: "Píšu dopis…" })).toBeDisabled();

    await page.clock.runFor(CLIENT_TIMEOUT_MS + 1000);
    const alert = dialog.getByRole("alert");
    await expect(alert).toContainText(TIMEOUT_MESSAGE);
    await expect(dialog.getByRole("button", { name: "Napsat motivační dopis" })).toBeEnabled();
    await alert.getByRole("button", { name: "Zkusit znovu" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator("#cv-page [data-letter]")).toBeVisible();
  });

  test("closing the dialog cancels the request and frees the buttons", async ({ page }) => {
    let aborted = false;
    await page.route("/api/tailor", () => new Promise(() => {}));
    page.on("requestfailed", (r) => {
      if (r.url().endsWith("/api/tailor")) aborted = true;
    });
    await loadSample(page);
    await page.getByTestId("next-tailor").getByRole("button").click();
    const dialog = page.getByRole("dialog", { name: "Přizpůsobit inzerátu" });
    await dialog.getByLabel("Text inzerátu").fill(JOB);
    await dialog.getByRole("button", { name: "Přizpůsobit životopis" }).click();
    await expect(dialog.getByRole("button", { name: "Přizpůsobuji…" })).toBeDisabled();
    await dialog.getByRole("button", { name: "Zrušit" }).click();
    await expect(dialog).toBeHidden();
    await expect.poll(() => aborted).toBe(true);

    await page.unroute("/api/tailor");
    await page.getByTestId("next-tailor").getByRole("button").click();
    await expect(dialog.getByRole("button", { name: "Přizpůsobit životopis" })).toBeEnabled();
    await expect(dialog.getByRole("alert")).toHaveCount(0);
  });

  test("creating the CV gives up too and offers a retry", async ({ page }) => {
    await page.clock.install();
    await page.route("/api/cv", () => new Promise(() => {}));
    await page.goto("/#studio");
    await page.getByRole("button", { name: "Chaotický text" }).click();
    await page.getByRole("button", { name: "Vytvořit životopis" }).filter({ visible: true }).first().click();
    await page.clock.runFor(CLIENT_TIMEOUT_MS + 1000);
    const alert = page.getByRole("alert").filter({ hasText: TIMEOUT_MESSAGE });
    await expect(alert).toBeVisible();
    await expect(alert.getByRole("button", { name: "Zkusit znovu" })).toBeEnabled();
  });
});

test("a job ad copied with the whole web page is cleaned before sending", async ({ page }) => {
  let sent = "";
  await page.route("/api/letter", async (route) => {
    sent = (route.request().postDataJSON() as { job: string }).job;
    await route.continue();
  });
  await loadSample(page);
  await page.getByTestId("next-letter").getByRole("button").click();
  const dialog = page.getByRole("dialog", { name: "Motivační dopis k inzerátu" });
  await dialog.getByLabel("Text inzerátu").fill(PAGE_WITH_CLUTTER);
  await expect(dialog).toContainText(`${PAGE_WITH_CLUTTER.length} / 8 000`);
  await dialog.getByRole("button", { name: "Napsat motivační dopis" }).click();
  await expect(dialog).toBeHidden();
  expect(sent).toBe(JOB);
});
