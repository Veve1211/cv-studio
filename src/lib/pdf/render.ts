import { PRINT_GLOBAL, type PrintData } from "./print-data";
import { PRINT_HEADER, printToken } from "./print-token";

const RENDER_TIMEOUT_MS = 30_000;
const MAX_CONCURRENT = 2;

type Browser = import("puppeteer-core").Browser;

let browserPromise: Promise<Browser> | null = null;
let active = 0;
const queue: Array<() => void> = [];

async function launch(): Promise<Browser> {
  const puppeteer = (await import("puppeteer-core")).default;
  const custom = process.env.CHROMIUM_PATH;
  if (custom) {
    // Local / CI: a regular Chromium (e.g. the one Playwright installs).
    return puppeteer.launch({ executablePath: custom, headless: true, args: ["--no-sandbox", "--font-render-hinting=none"] });
  }
  // Railway (no Docker): self-contained Chromium build with its own libraries.
  const chromium = (await import("@sparticuz/chromium")).default;
  return puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: "shell",
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
  });
}

async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    if (browser?.connected) return browser;
  }
  browserPromise = launch();
  return browserPromise;
}

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) await new Promise<void>((resolve) => queue.push(resolve));
  active++;
  try {
    return await fn();
  } finally {
    active--;
    queue.shift()?.();
  }
}

/** Where the headless browser can reach this very server. */
export function internalOrigin(): string {
  return process.env.INTERNAL_URL?.replace(/\/$/, "") || `http://127.0.0.1:${process.env.PORT || 3000}`;
}

/**
 * Renders the CV to a PDF in headless Chromium. The data is handed to the page in
 * memory (never in a URL, never stored) and the page is only reachable with a secret.
 */
export async function renderCvPdf(data: PrintData): Promise<Uint8Array> {
  const token = printToken();
  if (!token) throw new Error("PDF rendering secret is not configured");
  return withSlot(async () => {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      page.setDefaultTimeout(RENDER_TIMEOUT_MS);
      // The browser is shared between renders: never answer from cache (304).
      await page.setCacheEnabled(false);
      await page.setExtraHTTPHeaders({ [PRINT_HEADER]: token });
      await page.evaluateOnNewDocument(
        (name: string, value: unknown) => {
          Object.defineProperty(window, name, { value, configurable: false, writable: false });
        },
        PRINT_GLOBAL,
        data,
      );
      const res = await page.goto(`${internalOrigin()}/tisk`, { waitUntil: "networkidle0" });
      if (!res || (!res.ok() && res.status() !== 304)) throw new Error(`Print page responded ${res?.status()}`);
      await page.waitForSelector("html[data-ready]");
      return await page.pdf({ preferCSSPageSize: true, printBackground: true });
    } finally {
      await page.close().catch(() => {});
    }
  });
}
