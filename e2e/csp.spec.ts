import { expect, test } from "@playwright/test";
import { loadSample, pickRadio } from "./helpers";

test.describe("Content-Security-Policy", () => {
  test("pages send a strict CSP with a fresh nonce per request", async ({ request }) => {
    const a = (await request.get("/")).headers()["content-security-policy"];
    const b = (await request.get("/")).headers()["content-security-policy"];
    expect(a).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(a).toContain("object-src 'none'");
    expect(a).toContain("frame-ancestors 'none'");
    expect(a).not.toContain("unsafe-eval");
    const nonce = (csp: string) => csp.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce(a)).not.toBe(nonce(b));
  });

  test("the app works without a single CSP violation", async ({ page, browserName }) => {
    const violations: string[] = [];
    page.on("console", (msg) => {
      if (/Content Security Policy|Refused to (execute|load|apply)/i.test(msg.text())) violations.push(msg.text());
    });
    // Also catch silent violations that only DevTools reports (e.g. a library probing eval).
    if (browserName === "chromium") {
      const cdp = await page.context().newCDPSession(page);
      cdp.on("Audits.issueAdded", (e: { issue: { code: string; details: unknown } }) => {
        if (e.issue.code === "ContentSecurityPolicyIssue") violations.push(JSON.stringify(e.issue.details));
      });
      await cdp.send("Audits.enable");
    }
    await loadSample(page);
    await pickRadio(page, "Terminál");
    await page.locator('#cv-page [data-path="name"]').click();
    await page.keyboard.press("Enter");
    await page.goto("/soukromi");
    await page.goto("/neexistuje");
    expect(violations).toEqual([]);
  });

  test("an inline script injected into the HTML (no nonce) is blocked", async ({ page }) => {
    // Simulate an XSS: the server response gets an extra parser-inserted <script>.
    await page.route("/", async (route) => {
      const response = await route.fetch();
      const html = (await response.text()).replace("</body>", "<script>window.__pwned = true</script></body>");
      await route.fulfill({ response, body: html });
    });
    const blocked: string[] = [];
    page.on("console", (msg) => {
      if (/Content Security Policy/i.test(msg.text())) blocked.push(msg.text());
    });
    await page.goto("/");
    expect(await page.evaluate(() => (window as unknown as { __pwned?: boolean }).__pwned === true)).toBe(false);
    expect(blocked.length).toBeGreaterThan(0);
  });
});
