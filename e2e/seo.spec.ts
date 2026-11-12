import { expect, test } from "@playwright/test";

test.describe("sharing and search", () => {
  test.skip(({ isMobile }) => isMobile, "metadata does not depend on the viewport");

  test("home page has title, description, Open Graph and structured data", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Cvéčko – životopis z pár vět");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /AI/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Cvéčko/);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "cs_CZ");
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImage).toMatch(/opengraph-image/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");

    const blocks = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t));
    const app = blocks.find((d) => d["@type"] === "WebApplication");
    expect(app.inLanguage).toBe("cs");
    expect(blocks.some((d) => d["@type"] === "FAQPage")).toBe(true);
  });

  test("Open Graph image is a 1200×630 PNG", async ({ request }) => {
    const res = await request.get("/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    const png = await res.body();
    // PNG IHDR: width and height are big-endian ints at bytes 16–23
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  test("robots.txt and sitemap.xml", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Disallow: /tisk");
    expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/soukromi</loc>");
  });

  test("privacy page title is not doubled", async ({ page }) => {
    await page.goto("/soukromi");
    await expect(page).toHaveTitle("Zásady ochrany osobních údajů – Cvéčko");
  });

  test("no analytics script without ANALYTICS_URL", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (r) => {
      const url = new URL(r.url());
      if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") external.push(url.hostname);
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(external).toEqual([]);
  });
});
