import { describe, expect, it } from "vitest";
import { cleanJobText, JOB_TEXT_LIMIT, prepareJobText } from "./clean-job";

const AD = `Přejít na záhlaví
Přejít na obsah
Nabídky práce
Pro firmy
Přihlásit se
Specialista/ka sociálních sítí
Kavárna U Modré konvice, Brno
Náplň práce:
- správa Instagramu a Facebooku
- tvorba příspěvků v Canvě
Požadujeme:
- Excel
- angličtina B1
Uložit
Sdílet
Zpětná vazba
Používáme cookies, abychom vám zobrazili relevantní nabídky.
© 2026 Pracovní portál s.r.o. Všechna práva vyhrazena.
Ochrana osobních údajů`;

describe("cleanJobText", () => {
  it("drops website clutter and keeps the ad", () => {
    const out = cleanJobText(AD);
    for (const gone of ["Přejít na záhlaví", "Přihlásit se", "Zpětná vazba", "cookies", "©", "Ochrana osobních údajů", "Sdílet"]) {
      expect(out).not.toContain(gone);
    }
    for (const kept of ["Specialista/ka sociálních sítí", "správa Instagramu a Facebooku", "- Excel", "- angličtina B1", "Kavárna U Modré konvice"]) {
      expect(out).toContain(kept);
    }
  });

  it("keeps long sentences that merely mention a clutter word", () => {
    const line = "Budete spravovat náš Instagram a Facebook a připravovat kampaně, cookies řešit nebudete, to je jasné.";
    expect(cleanJobText(line)).toBe(line);
  });

  it("caps very long pasted pages", () => {
    const long = `${AD}\n${"Popis práce a požadavky na pozici. ".repeat(600)}`;
    const result = prepareJobText(long);
    expect(result.text.length).toBeLessThanOrEqual(JOB_TEXT_LIMIT);
    expect(result.truncated).toBe(true);
    expect(result.cleaned).toBe(true);
    expect(prepareJobText("Hledáme účetní do Ostravy, Pohoda, Excel.").cleaned).toBe(false);
  });
});
