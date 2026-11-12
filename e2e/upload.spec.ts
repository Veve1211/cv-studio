import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const FIXTURES = path.join(process.cwd(), "src", "lib", "extract", "__fixtures__");
const fixture = (name: string) => path.join(FIXTURES, name);

async function dropFile(page: Page, name: string, mime: string) {
  const bytes = [...readFileSync(fixture(name))];
  const dataTransfer = await page.evaluateHandle(
    ({ bytes, name, mime }) => {
      const dt = new DataTransfer();
      dt.items.add(new File([new Uint8Array(bytes)], name, { type: mime }));
      return dt;
    },
    { bytes, name, mime },
  );
  const area = page.locator("section[aria-labelledby='studio-title']");
  await area.dispatchEvent("dragenter", { dataTransfer });
  await expect(page.getByTestId("drop-overlay")).toBeVisible();
  await area.dispatchEvent("drop", { dataTransfer });
}

test.describe("upload an old CV", () => {
  test("PDF via the button fills the text field", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("file-input").setInputFiles(fixture("zivotopis.pdf"));
    const field = page.getByLabel("Napiš o sobě cokoliv");
    await expect(field).toHaveValue(/Jana Kovářová/);
    await expect(field).toHaveValue(/Ocel a\.s\./);
    await expect(page.getByRole("status").filter({ hasText: "Načteno ze souboru zivotopis.pdf" })).toBeVisible();
  });

  test("DOCX can be dropped anywhere on the left side", async ({ page }) => {
    await page.goto("/");
    await dropFile(page, "zivotopis.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    await expect(page.getByLabel("Napiš o sobě cokoliv")).toHaveValue(/Tomáš Novotný/);
    await expect(page.getByTestId("drop-overlay")).toHaveCount(0);
  });

  test("a renamed text file is rejected by the server with a clear message", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("file-input").setInputFiles(fixture("falesne.pdf"));
    await expect(page.getByRole("alert").filter({ hasText: "PDF nebo Word" })).toBeVisible();
    await expect(page.getByLabel("Napiš o sobě cokoliv")).toHaveValue("");
  });

  test("unsupported formats are rejected right away", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("file-input").setInputFiles({ name: "foto.jpg", mimeType: "image/jpeg", buffer: Buffer.from("x") });
    await expect(page.getByRole("alert").filter({ hasText: "PDF nebo Word" })).toBeVisible();
    await page.getByTestId("file-input").setInputFiles({ name: "stary.doc", mimeType: "application/msword", buffer: Buffer.from("x") });
    await expect(page.getByRole("alert").filter({ hasText: ".docx" })).toBeVisible();
  });

  test("a scanned PDF explains there is no text", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("file-input").setInputFiles(fixture("sken.pdf"));
    await expect(page.getByRole("alert").filter({ hasText: "naskenovaný" })).toBeVisible();
  });

  test("uploaded text can be turned into a CV", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("file-input").setInputFiles(fixture("zivotopis.pdf"));
    await expect(page.getByLabel("Napiš o sobě cokoliv")).toHaveValue(/Jana/);
    await page.getByRole("button", { name: "Vytvořit životopis" }).first().click();
    await expect(page.locator("#cv-page")).toBeVisible();
  });
});
