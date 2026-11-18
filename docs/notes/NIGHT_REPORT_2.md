# Noční report 2 – Cvéčko (cv-studio)

Datum: 2026-11-09 · Cíl: posunout Cvéčko z ukázky na aplikaci, kterou jde ukázat investorovi a prodávat.
Světle modrý vzhled (#9) zůstal zachovaný a jen se rozvíjel, nic se nepřebarvovalo.

## Hotové a zmergované do `dev`

Každá fáze měla vlastní větev, PR do `dev` a merge (squash) až po zeleném CI (lint, typecheck, Vitest, build, Playwright desktop i mobil).

| Fáze | PR | Co přinesla |
| --- | --- | --- |
| 1. Pojistka proti vymýšlení | #10 | Kontrola v kódu (ne přes AI): firmy, školy, roky, čísla, dovednosti, jazyky, kontakty, jména. Co ve vstupu nebylo, je žlutě podtržené s tooltipem „Tohle v tvém textu nebylo, zkontroluj“. 10 testovacích vstupů. |
| 2. Nahrání starého životopisu | #11 | PDF a Word (DOCX) do 5 MB, tlačítko i přetažení na levou stranu, text se vytáhne jen v paměti. |
| 3. PDF zamčené na serveru | #12 | Se Stripe klíčem se PDF vyrábí až na serveru po ověření platby (headless Chromium). Nezaplacený náhled má vodoznak. Bez klíče se nic nemění. |
| 4. Mobil | #13 | Spodní lišta pro palec, přepínač Text / Náhled, přiblížení náhledu, žádný vodorovný scroll. |
| 5. Průvodce a prázdné stavy | #14 | 3 klikací příklady, 3 animované kroky načítání, jednorázová nápověda „Klikni do textu a přepiš ho“. |
| 6. Motivační dopis | #15 | Z inzerátu a údajů v životopise, ve stejné šabloně a barvě, s úpravami a kontrolou vymýšlení, PDF stejně jako životopis. |
| 7. Sdílení a návštěvnost | #16 | OG obrázek 1200×630, sitemap, robots, strukturovaná data, měření bez cookies (jen s `ANALYTICS_URL`). |
| 8. Rychlost a kvalita | #17 | Přísná CSP s nonce, rate limit přežívající restart, Lighthouse ≥ 95. |
| 9. Landing, který prodává | #18 | Před a po, Cena (jen se zapnutým Stripe), FAQ; tento report. |

Pokud některý z posledních PR (#17, #18) v době, kdy tohle čteš, ještě není zmergovaný, čeká jen na CI. Podívej se na něj na GitHubu.

## Co čeká na tebe / co zůstalo otevřené

- **Kontakt a identifikace provozovatele.** Než začneš skutečně prodávat, musí být na webu kontakt (e-mail), identifikace provozovatele (jméno/IČO) a obchodní podmínky. Vyžaduje to zákon o ochraně spotřebitele i GDPR. Tyhle údaje se nesmí vymýšlet, proto na webu zatím chybí. FAQ slibuje vrácení peněz „když se ozveš“, takže kontakt je potřeba.
- **Serverové PDF** je ověřené v sandboxu i v CI, ne přímo na Railway (bez přístupu). Viz krok 7 níže.
- **Skutečné volání AI** nešlo vyzkoušet (chybí `ANTHROPIC_API_KEY`). Všechny testy běží s ukázkovými odpověďmi.

## Rozhodnutí

- **Kontrola vymýšlení je čistě v kódu.** Toleruje skloňování („v Brně“ = Brno) a běžné přepisy („řidičák“ → „řidičský průkaz“), u jmen je přísnější („Nová“ ≠ „Nováková“). Co uživatel sám přepíše, se už nepodtrhává. U „Ukázky“ se nekontroluje (chybí zdrojový text).
- **Nahrané soubory** se čtou na serveru jen v paměti (pdf.js, mammoth). Typ se pozná podle obsahu, ne podle přípony.
- **Serverové PDF:**
  - Chromium vykreslí interní stránku `/tisk`, data dostane jen v paměti a vrátí PDF.
  - `/tisk` je bez tajné hlavičky nedostupná (404).
  - Jedna platba platí 30 dní a pokryje životopis i dopis.
- **Mobil:** duplicitní tlačítka jsou na telefonu skrytá, hlavní akce je vždy dole v liště.
- **Motivační dopis:** o uchazeči jen fakta ze životopisu, z inzerátu jen firma, pozice a požadavky. Když inzerát chce něco, co v životopise není, dopis to netvrdí.
- **CSP:**
  - Kvůli nonce jsou všechny stránky dynamické, proto je `cacheComponents` vypnuté.
  - Styly zůstávají s `'unsafe-inline'`, protože React vykresluje `style=""` atributy a na ty nonce nefunguje.
  - Knihovna zod je v režimu `jitless` (jinak by tiše porušovala CSP).
- **Rate limit bez databáze:**
  - Limit podle IP v paměti + podepsaný HttpOnly cookie s počtem požadavků. Cookie platí i po restartu.
  - Kdo cookie smaže, narazí na limit podle IP. Úplně neprůstřelné to bez sdíleného úložiště (Redis) být nemůže.
- **Analytika** se načte jen s `ANALYTICS_URL` (https, Plausible nebo Umami). Čte se za běhu, takže stačí nastavit proměnnou a restartovat službu.
- **Cena a FAQ o platbě** se ukazují jen se zapnutým Stripe.

## Rizika

- **Paměť na Railway:** Chromium pro PDF potřebuje zhruba 500 MB až 1 GB RAM. Při malé instanci může render selhat. Uživatel pak dostane českou chybu „PDF se teď nepodařilo vytvořit“ a v logu je jen důvod, bez dat.
- **Kontrola vymýšlení** je heuristika. Může něco podtrhnout zbytečně (např. silně přeformulovanou školu) nebo výjimečně něco přehlédnout (vymyšlený popis bez čísel a jmen). Je to pomůcka, ne záruka.
- **Přesměrování na Stripe:** životopis a dopis se na dobu platby uloží do `sessionStorage` okna a po návratu se hned smažou. Uživatel o tom ví z dialogu i ze zásad.
- **Vodoznak a zámek tisku** v prohlížeči jdou obejít vývojářskými nástroji (vždy půjde udělat aspoň snímek obrazovky). Čisté PDF ale vzniká jen na serveru po zaplacení.
- **`npm audit`** hlásí střední zranitelnosti jen ve vývojových nástrojích (ESLint). Do aplikace se nedostanou.

## Lighthouse (produkční build, lokálně)

| Stránka | Výkon | Přístupnost | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` (landing i aplikace), mobil | 97 | 100 | 100 | 100 |
| `/soukromi`, mobil | 100 | 100 | 100 | 100 |
| `/`, desktop | 100 | 100 | 100 | 100 |

Mobil: LCP 1,1 s, TBT 180 ms, CLS 0. Měřeno na lokálním serveru; na Railway přibude latence sítě.

## Testy

- Vitest: přes 110 testů. Kontrola vymýšlení (10 vstupů), extrakce PDF/DOCX, PDF handler, platby, dopis, cookie rate limit…
- Playwright: přes 150 průchodů na počítači i mobilu. Tvorba, šablony, úpravy, PDF všech šablon (zlomy stran a úplnost textu), serverové PDF, platba, dopis, nahrávání, mobil, CSP, přístupnost axe WCAG 2.1 AA, SEO.

## Co ráno otestovat na stagingu (krok za krokem)

1. **Základ:** otevři staging. Landing, sekce „Před a po“ (při sjetí se životopis „poskládá“), FAQ dole.
2. **Vlastní text:** vlož skutečný starý životopis nebo pár vět a klikni na „Vytvořit životopis“. Zkontroluj, že žlutě podtržené jsou opravdu jen věci, které v textu nebyly.
3. **Nahrání:** přetáhni svůj starý životopis v PDF nebo Wordu na levou stranu. Text se objeví v poli.
4. **Úpravy:** klikni do textu v náhledu a přepiš ho; podtržení u přepsaného zmizí. Vyzkoušej „✨ Vylepšit shrnutí“.
5. **Dopis:** „✉️ Napsat motivační dopis“, vlož inzerát z jobs.cz. Zkontroluj, že dopis netvrdí nic, co v životopise není. Přepínej Životopis / Motivační dopis a měň šablony.
6. **PDF bez Stripe:** „Stáhnout PDF“ → tisk → Uložit jako PDF.
7. **PDF se Stripe (test mode):**
   - Nastav `STRIPE_SECRET_KEY` (`sk_test_…`) a `APP_URL`.
   - Zkontroluj, že je v náhledu vodoznak a na landingu sekce Cena.
   - „Stáhnout PDF“ → zaplať kartou `4242 4242 4242 4242` → po návratu „Stáhnout PDF“ stáhne čisté PDF ze serveru.
   - Zkus i motivační dopis.
   - Pokud se PDF nestáhne, podívej se do logu Railway na řádek „PDF rendering failed“ a zvyš paměť služby.
8. **Mobil:** totéž na telefonu. Spodní lišta, přepínač Text / Náhled, přiblížení 2×.
9. **Sdílení:** vlož odkaz na staging do Messengeru nebo na LinkedIn (Post Inspector). Měl by se ukázat modrý náhledový obrázek.

## Proměnné na Railway

| Proměnná | Povinná | Hodnota / poznámka |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | ano | klíč z console.anthropic.com |
| `APP_URL` | doporučeno | veřejná adresa, např. `https://cv-studio-dev.up.railway.app` (OG obrázek, sitemap, návrat ze Stripe) |
| `STRIPE_SECRET_KEY` | ne | `sk_test_…`; zapne platby, serverové PDF, vodoznak a sekci Cena |
| `PDF_RENDER_SECRET` | ne | libovolný dlouhý náhodný řetězec (jinak se odvodí ze Stripe klíče) |
| `RATE_LIMIT_SECRET` | ne | libovolný dlouhý náhodný řetězec (jinak se odvodí z jiného tajemství) |
| `ANALYTICS_URL`, `ANALYTICS_ID` | ne | Plausible (`https://plausible.io/js/script.js` + doména) nebo Umami (`…/script.js` + website id) |

`CHROMIUM_PATH` na Railway **nenastavuj**: Railway používá zabalený Chromium z `@sparticuz/chromium`. Proměnná slouží jen pro lokální vývoj a CI.
Paměť služby: doporučuji aspoň 1 GB (kvůli PDF).
