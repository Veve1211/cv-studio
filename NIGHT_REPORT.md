# Noční report – Cvéčko (cv-studio)

Datum: 2026-11-08 (noc)

## Hotové a zmergované do `dev`

| Fáze | PR | Stav |
| --- | --- | --- |
| 1. Základ (Next.js 16, Tailwind 4, CLAUDE.md, CI) | přímo na `main` + větev `dev` | ✅ |
| 2. Převod textu na data (Claude + zod) | #1 | ✅ zmergováno |
| 3. Hlavní stránka + A4 náhled + načítání + mobil | #2 | ✅ zmergováno |
| 4. 5 šablon, miniatury, 6 barev | #3 | ✅ zmergováno |
| 5. Úpravy v náhledu, Zpět, „Vylepšit shrnutí“ | #4 | ✅ zmergováno |
| 6. Export PDF (A4, zlomy stran otestované) | #5 | ✅ zmergováno |
| 7. Paywall Stripe (test mode) | #6 | ✅ zmergováno |

## Otevřené (čekají na tebe, nemergováno)

- **#7 Landing + zásady ochrany osobních údajů** – CI zelené. Nechávám otevřené podle tvé zprávy „nemerguj“.
- **PR fáze 9 (leštění)** – je postavený nad #7, takže obsahuje i jeho commit. Stačí zmergovat tento PR a #7 zavřít, nebo nejdřív #7 a pak tento.

## Rozhodnutí, která jsem udělal

- **Název:** Cvéčko (repo `cv-studio`).
- **Verze:** Next.js 16.4.5, React 19, Tailwind 4, zod 4, Vitest 5, Playwright 1.65, Stripe SDK 23, Anthropic SDK 1.6. TypeScript 5 a ESLint 9 jsem nechal tak, jak je nastavil oficiální `create-next-app`.
- **Model AI:** `claude-opus-5-5` se strukturovaným výstupem (JSON schéma) a záložním modelem při odmítnutí. Prompt zakazuje přidávat fakta; výstup se validuje přes zod.
- **Osobní údaje:** text se neukládá ani neloguje (test to hlídá). Jediná výjimka: při platbě se životopis na dobu přesměrování na Stripe uloží do `sessionStorage` prohlížeče a po návratu se hned smaže. Jinak by se po platbě ztratil. Uživatel o tom ví z dialogu i ze zásad.
- **PDF:** tisk prohlížeče („Uložit jako PDF“). První strana je bez okrajů, další strany mají okraj 14/12 mm a okraje mají barvu papíru šablony. Testy ověřují, že krátký životopis má přesně 1 stranu, dlouhý 2 strany a v PDF je veškerý text.
- **Paywall:** bez `STRIPE_SECRET_KEY` je PDF zdarma a o platbě není ani zmínka. Se zamčeným PDF vytiskne Ctrl+P jen upozornění. Je to ochrana v prohlížeči, šikovný člověk ji obejde přes vývojářské nástroje (pro ukázku v pořádku).
- **Šablony:** React komponenty + CSS moduly v mm/pt. Miniatury i landing vykreslují skutečné šablony, ne obrázky.
- **Rate limit:** v paměti serveru podle IP (10 životopisů / 15 min, 20 shrnutí / 15 min). Pro e2e testy jde vypnout přes `RATE_LIMIT_DISABLED=1`.
- **Opravy během noci:** pravidlo Tailwind loaderu ze šablony `create-next-app` rozbíjelo CSS moduly (omezil jsem ho na `globals.css`); v šabloně Blok se sekce Praxe celá přesouvala na 2. stranu PDF; korálová barva a šedé texty v Minimal neměly dostatečný kontrast.

## Testy

- Vitest: 55 testů (schéma, volání AI s mockem, rate limit, úpravy, typografie, paleta, PDF název, Stripe).
- Playwright: 87 průchodů na počítači i mobilu (vytvoření, chyby, načítání, šablony, barvy, úpravy, PDF pro všech 5 šablon, platba, přístupnost axe WCAG 2.1 AA, 404, hlavičky).
- CI (GitHub Actions) spouští lint, typecheck, Vitest, build a Playwright u každého PR.

## Co otestovat ráno na stagingu (krok za krokem)

1. Otevři staging a sjeď landingem dolů. Klikni na „Vytvořit životopis“, stránka skočí k formuláři.
2. Vlož svůj skutečný starý životopis nebo pár neučesaných vět a klikni na „Vytvořit životopis“. **Tohle je jediná věc, kterou jsem nemohl vyzkoušet naživo (nemám klíč k AI).** Zkontroluj, že si AI nic nevymyslela.
3. Projdi všech 5 šablon a 6 barev.
4. Klikni do textu v životopise a něco přepiš; vyzkoušej „Zpět“ a „✨ Vylepšit shrnutí“.
5. Klikni na „Stáhnout PDF“ a ulož jako PDF (v Chrome: Cíl → Uložit jako PDF). Zkontroluj, že PDF vypadá jako náhled.
6. Pokud nastavíš Stripe test klíč: zaplať kartou `4242 4242 4242 4242` (libovolné budoucí datum a CVC) a ověř, že se po návratu životopis obnoví a PDF jde stáhnout. Zkus i „Zrušit“ na stránce Stripe.
7. Totéž na mobilu.

## Proměnné na Railway

| Proměnná | Kde | Hodnota |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | staging i produkce | klíč z console.anthropic.com |
| `STRIPE_SECRET_KEY` | volitelně | `sk_test_…` ze Stripe Dashboard (Developers → API keys, testovací režim) |
| `APP_URL` | doporučeno se Stripe | veřejná adresa služby, např. `https://cv-studio-dev.up.railway.app` |

Build a start příkaz Railway pozná sám (`npm run build`, `npm start`). `PORT` nastavuje Railway.

## Rizika a dluhy

- `npm audit` hlásí 8 středních zranitelností jen ve vývojových nástrojích (minimatch přes ESLint). Do aplikace se nedostanou, opraví je až nová verze ESLint/typescript-eslint.
- Rate limit je v paměti, takže při více instancích nebo po restartu se nuluje.
- Plná Content-Security-Policy není nastavená (chtělo by to nonce kvůli inline skriptům Next.js).
- Náhled na mobilu je malý (zmenšená A4); při čtení pomůže přiblížení prsty.
