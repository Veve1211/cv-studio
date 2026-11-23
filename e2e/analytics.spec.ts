import { expect, test } from "@playwright/test";

// The analytics script itself only loads with ANALYTICS_URL (see seo.spec.ts). Here a fake
// `window.plausible` stands in for it, to check which funnel events the app sends.
test("funnel events: only fixed names, never the user's text", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { plausible: (...args: unknown[]) => void; __events: unknown[][]; print: () => void };
    w.__events = [];
    w.plausible = (...args) => w.__events.push(args);
    w.print = () => {};
  });
  await page.goto("/");
  const secret = "Jana Tajná, jana.tajna@example.com, 10 let v Kvetoucí s.r.o.";
  await page.getByLabel("Napiš o sobě cokoliv").fill(secret);
  await page.getByRole("button", { name: "Vytvořit životopis" }).filter({ visible: true }).first().click();
  await page.locator("#cv-page").waitFor();
  await page.getByRole("button", { name: "Stáhnout PDF" }).filter({ visible: true }).first().click();

  const events = await page.evaluate(() => (window as unknown as { __events: unknown[][] }).__events);
  expect(events).toEqual([["CV vytvořeno"], ["PDF stažení"]]);
  expect(JSON.stringify(events)).not.toContain("Jana");
});
