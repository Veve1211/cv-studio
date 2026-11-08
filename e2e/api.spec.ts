import { expect, test } from "@playwright/test";

test.describe("CV API", () => {
  test.skip(({ isMobile }) => isMobile, "API does not depend on viewport");

  test("returns mocked CV and rejects short input", async ({ request }) => {
    const ok = await request.post("/api/cv", { data: { text: "Jsem designérka z Brna, mám šest let praxe." } });
    expect(ok.status()).toBe(200);
    expect((await ok.json()).cv.name).toBeTruthy();

    const bad = await request.post("/api/cv", { data: { text: "ahoj" } });
    expect(bad.status()).toBe(400);
    expect((await bad.json()).error).toContain("aspoň pár vět");
  });
});
