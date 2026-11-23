# Audit Cvéčka – případová studie (23. 11. 2026)

Audit kódu, bezpečnosti a výkonu aplikace postavené vibecodingem. Všechna čísla jsou naměřená (lokální build
v cloud sandboxu), ne odhadnutá. Chování aplikace pro uživatele se nezměnilo.

## Výchozí stav

Projekt byl v dobré kondici: zelené CI, 145 unit testů, 226 e2e testů (počítač + mobil), 0 zranitelností
v závislostech, CSP s nonce, podepsané cookies, žádné logování textu uživatele, přístupnost a SEO 100 v Lighthouse.

Audit přesto našel:

| # | Nález | Závažnost | Ověření |
|---|---|---|---|
| 1 | Tajná hlavička serverového PDF unikala na server analytiky (když je nastavené `ANALYTICS_URL`) | důležité | pokus: 8 z 8 renderů |
| 2 | Limit pokusů bere první IP z `X-Forwarded-For`; na Railway buď jde podvrhnout, nebo všichni sdílí jednu IP | důležité | **NEOVĚŘENO**, čeká na test na stagingu |
| 3 | Žádný celkový strop výdajů za AI, jen limity na jednu IP | důležité | čtení kódu |
| 4 | Cizí web mohl z prohlížeče návštěvníka poslat formulář na `/api/cv` a čerpat AI | drobnost | pokus: odpověď 200 |
| 5 | Úvod na mobilu: výkon 70–74 (LCP 4,8 s), v dokumentaci stálo 97 | důležité | Lighthouse, 3 běhy |
| 6 | Psaní do pole překreslovalo náhled a 8 miniatur šablon | drobnost | měření psaní |
| 7 | Mrtvý kód, stejné funkce ve třech souborech, slogan napsaný třikrát | drobnost | grep |
| 8 | Dokumentace neodpovídala kódu (časové limity, Lighthouse, audit) a chyběl `global-error` | drobnost | čtení |

## Co se změnilo

| Oprava | Před | Po |
|---|---|---|
| Hlavička PDF jen na vlastní server, cizí požadavky blokované | 8 z 8 renderů poslalo tajemství analytice | 0 z 8 |
| API bere jen `application/json` | cizí formulář (`text/plain`) → 200 | → 400, aplikace dál 200 |
| Denní strop AI pro celý server (`AI_DAILY_LIMIT`, výchozí 500) | bez stropu | 501. volání za den → česká hláška 503 |
| `memo` pro šablony a výběr šablon | psaní 37 znaků 2,23–2,30 s, medián klávesy 56 ms | 1,83–2,00 s, 40–48 ms (CPU 4× zpomalené) |
| Úklid: mrtvý kód, `src/lib/cookies.ts`, `SITE_TAGLINE` | – | 9 souborů, −63 / +40 řádků |
| `global-error.tsx`, opravené `CLAUDE.md` a `SECURITY.md` | – | – |

## Čísla celkově

| Metrika | Před | Po |
|---|---|---|
| Unit testy (Vitest) | 145 | 155 |
| E2E testy (Playwright, počítač + mobil) | 226 prošlo, 0 selhalo | 226 prošlo, 0 selhalo |
| Lint, typecheck, build | zelené | zelené |
| `npm audit` | 0 | 0 |
| JS + CSS na úvodu (gzip) | 253 KB | 253 KB |
| Lighthouse úvod mobil (výkon / přístupnost / BP / SEO) | 70–74 / 100 / 100 / 100 | 70–74 / 100 / 100 / 100 |
| Lighthouse úvod desktop | 96 / 100 / 100 / 100 | beze změny |

## Co nevyšlo

- **Přednačtení písma nadpisu** (Space Grotesk): první vykreslení se zrychlilo (FCP 2,9 → 2,4 s), ale LCP se
  zhoršilo (4,8 → 5,1 s) a skóre se nezlepšilo. Změna vrácena.
- **Chyba v mém měření:** první měření psaní ukazovalo „2× víc pomalých událostí“. Šlo o chybu ve skriptu
  (dva posluchače najednou). Po opravě je rozdíl menší, viz tabulka.

## Co zbývá

1. **Ověřit IP na Railway** (nález 2): pár požadavků na staging s podvrženou hlavičkou, pak případně brát `X-Real-IP`.
2. **Limit útraty v Anthropic konzoli:** tvrdý strop, který kód nahradit nemůže.
3. **Výkon úvodu na mobilu:** úvod stahuje 9 písem (asi 385 KB), protože ukázky šablon používají jejich písma.
   Chce to návrh, jak ukázky načítat později, aniž by se změnil vzhled.
4. `cv-studio.tsx` má 730 řádků. Rozdělit, až se do něj bude znovu sahat.
5. `error.tsx` používá `reset()`, Next 16 doporučuje `retry()` (znovu načte data ze serveru).

## Jak pracuju

Nejdřív měření, potom nálezy se soubor:řádek, potom malé opravy, každá ověřená testy a čísly před/po.
Co se nepodařilo ověřit, je označené NEOVĚŘENO. Co čísla nezlepšilo, šlo zpátky.
