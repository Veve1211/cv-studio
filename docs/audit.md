# Audit: případová studie (listopad 2026)

Audit hotové aplikace před odevzdáním do portfolia. Cíl: najít, co uživatelům nebo provozu reálně
vadí, opravit jen levné a bezpečné věci a u každé změny ukázat ověření nebo čísla.

## Postup

1. **Fáze 1 – průzkum.** Aplikace prošlá z pohledu uživatele i lektora (pravdivost textů, náklady
   na AI), Lighthouse, řádek po řádku serverové části s největším rizikem: `proxy.ts` (CSP,
   ochrana `/tisk`), generování PDF, nahrávání souborů, podepsané cookies a přístup.
2. **Fáze 2 – návrh.** Každý nález dostal závažnost, odhad práce a návrh řešení; Veve schválila,
   co se dělá hned.
3. **Fáze 3 – quick wins.** Každá oprava zvlášť ve feature větvi z `dev`, s testem, PR do `dev`.
   Do `main` merguje jen Veve.

## Co se udělalo

| Oblast | Problém | Řešení | Ověření | PR |
|---|---|---|---|---|
| Náklady na AI | Limit podle IP a cookie jde obejít, útrata nemá strop | Společný denní limit volání AI (`AI_DAILY_LIMIT`, výchozí 300), po vyčerpání česká hláška (503) | 3 nové testy | #43 |
| Pravdivé texty | „Nic si nevymýšlí“ slibovalo víc, než AI zaručí | Texty říkají, co se opravdu děje: co AI doplní navíc, označíme žlutě | e2e text FAQ upravený | #43 |
| Ukázková CV | Roky praxe neseděly s daty | Opravené roky (stav 2026) | – | #43 |
| Nahrávání | Kontrola velikosti spoléhala na `Content-Length`; chunked požadavek by se načetl celý | Upload bez `Content-Length` → 411 | Vitest 147/147 | #44 |
| Nahrávání | DOCX je ZIP – „zip bomba“ by se rozbalila do paměti | Před rozbalením se sečtou velikosti z centrálního adresáře ZIPu, max 30 MB, ZIP64 odmítnut | 2 nové testy | #44 |

V pořádku bez změny: HMAC podpisy s oddělenými účely a porovnáním odolným vůči měření času,
`/tisk` jen s tajnou hlavičkou, šablony nenačítají obrázky z adres od uživatele (serverový Chromium
nejde zneužít na dotazy do vnitřní sítě), max 2 souběžné rendery PDF.

## Co se změřilo a nedělá se

**C5 – `browserslist`.** Předpoklad: nastavení cílových prohlížečů v `package.json` odstraní
zbytečné polyfilly. Měření (úvodní stránka, skripty, které stáhne moderní prohlížeč, produkční build):

| Cílové prohlížeče | JS úvodní stránky | CSS celkem |
|---|---|---|
| bez nastavení (výchozí Next: Chrome/Edge/Firefox 111, Safari 16.4) | 687 156 B (202 784 B gzip) | 82 988 B |
| Chrome/Edge/Firefox 130, Safari 18 | beze změny | 81 452 B (−1 536 B) |

Proč: balík polyfillů core-js má `noModule`, takže ho moderní prohlížeč vůbec nestáhne. Zbytek
jsou vestavěné polyfilly Next.js v hlavním chunku (~1,4 kB, 0,6 kB gzip), které `browserslist`
neovlivní. Vyšší cíl by ušetřil 1,5 kB CSS, ale vyřadil by starší iPhony (Safari 16.4–17), na kterých
si lidé životopis často dělají. **Rozhodnutí: beze změny.** Stejný výsledek vyšel i v Českém králi.

## Co zůstává

- Po sloučení #43: v Anthropic Console nastavit měsíční spending limit (tvrdá pojistka nad denním stropem v kódu).
- Zbytkové riziko u DOCX (podvržené velikosti v ZIPu) je popsané v `SECURITY.md`.

## Co si z toho beru

- Měřit před opravou: úspora z `browserslist` vypadala jistě a vyšla nulová.
- U aplikace s AI je největší provozní riziko útrata, ne výkon – strop patří do kódu i do konzole poskytovatele.
- Sliby na webu musí odpovídat tomu, co technika opravdu zaručí.
