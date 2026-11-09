import { expect, test } from "@playwright/test";

test("home page renders the landing and the studio", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Cvéčko/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Napiš o sobě pár vět");
  await expect(page.getByText("Bez formulářů. Vlož text, máš životopis.")).toBeVisible();
  await expect(page.getByLabel("Napiš o sobě cokoliv")).toBeAttached();
});
