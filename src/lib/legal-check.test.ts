import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assertLegalPagesComplete, checkLegalPages, findPlaceholders } from "./legal-check";

const read = (path: string) => readFileSync(path, "utf8");

describe("legal pages build guard", () => {
  it("finds Fill placeholders and literal [DOPLNIT]", () => {
    expect(findPlaceholders(`IČO: <Fill what="IČO" /> <Fill what="adresa" />`)).toEqual(["IČO", "adresa"]);
    expect(findPlaceholders("Sídlo: [DOPLNIT adresa]")).toEqual(["[DOPLNIT]"]);
    expect(findPlaceholders("IČO: 12345678, Ulice 1, Praha")).toEqual([]);
  });

  it("does nothing without a Stripe key", () => {
    expect(checkLegalPages({}, read)).toEqual([]);
    expect(() => assertLegalPagesComplete({ STRIPE_SECRET_KEY: " " }, read)).not.toThrow();
  });

  it("fails with a Stripe key while IČO and address are still placeholders", () => {
    const missing = checkLegalPages({ STRIPE_SECRET_KEY: "sk_test_x" }, read);
    expect(missing).toContain("src/app/obchodni-podminky/page.tsx: IČO");
    expect(missing).toContain("src/app/obchodni-podminky/page.tsx: adresa");
    expect(missing).toContain("src/app/reklamace/page.tsx: IČO");
    expect(() => assertLegalPagesComplete({ STRIPE_SECRET_KEY: "sk_test_x" }, read)).toThrow(/placeholders/);
  });

  it("passes with a Stripe key once the pages are filled in", () => {
    const filled = () => "<p>IČO 12345678, Ulice 1, 110 00 Praha</p>";
    expect(() => assertLegalPagesComplete({ STRIPE_SECRET_KEY: "sk_test_x" }, filled)).not.toThrow();
  });
});
