import { expect, test } from "@playwright/test";
import { PAYWALL_PORT } from "../playwright.config";
import { LONG_SAMPLE_CV, SAMPLE_CV } from "../src/lib/cv/sample";
import { pdfPages, squash } from "./pdf";

// The mock Stripe server accepts "cs_test_mock" as a paid session.
test.use({ baseURL: `http://localhost:${PAYWALL_PORT}` });
test.skip(({ isMobile }) => isMobile, "server rendering does not depend on the viewport");

for (const templateId of ["magazine", "timeline", "minimal", "block", "terminal"] as const) {
  test(`server PDF for ${templateId}: short = 1 page, long = 2 pages with all text`, async ({ request }) => {
    const short = await request.post("/api/pdf", {
      data: { sessionId: "cs_test_mock", cv: SAMPLE_CV, templateId, accentId: "sky" },
    });
    expect(short.status()).toBe(200);
    expect(short.headers()["content-type"]).toBe("application/pdf");
    expect(await pdfPages(await short.body())).toHaveLength(1);

    const long = await request.post("/api/pdf", {
      data: { sessionId: "cs_test_mock", cv: LONG_SAMPLE_CV, templateId, accentId: "coral" },
    });
    const pages = await pdfPages(await long.body());
    expect(pages).toHaveLength(2);
    const all = pages.join("").toLowerCase();
    for (const e of LONG_SAMPLE_CV.experience) {
      expect(all).toContain(squash(e.role).toLowerCase());
      for (const h of e.highlights) expect(all).toContain(squash(h).toLowerCase());
    }
    expect(all).not.toContain(squash("NÁHLED").toLowerCase());
  });
}
