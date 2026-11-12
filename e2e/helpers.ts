import type { Page } from "@playwright/test";

/** Clicks the visible label of a visually hidden radio (as a real user would). */
export async function pickRadio(page: Page, name: string) {
  const radio = page.getByRole("radio", { name, exact: true });
  await page.locator("label").filter({ has: radio }).click();
  return radio;
}

export async function loadSample(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Ukázka" }).click();
  await page.locator("#cv-page").waitFor();
}

/** Opens the "Další možnosti" menu (undo, summary, …). */
export async function openMore(page: Page) {
  const menu = page.locator("details.more-menu");
  if (!(await menu.evaluate((el) => (el as HTMLDetailsElement).open))) {
    await menu.locator("summary").click();
  }
  return menu;
}
