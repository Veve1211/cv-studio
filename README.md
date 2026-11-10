# Cvéčko

Cvéčko udělá z libovolného textu o tobě hotový životopis v češtině. Nevyplňuješ žádný formulář: vložíš poznámky, starý
životopis nebo jen pár neučesaných vět (případně nahraješ PDF či Word) a AI (Claude) z toho poskládá životopis v moderní
šabloně. Text pak můžeš přepsat přímo v náhledu a stáhnout jako PDF.

**Staging:** https://cv-studio-production-4ae6.up.railway.app

## Hlavní funkce

- životopis z volného textu nebo nahraného PDF / DOCX
- 8 šablon (Aura, Švýcar, Bento, Časopis, Časová osa, Minimal, Blok, Terminál) a 7 barev, úpravy přímo v náhledu
- PDF ve formátu A4, které vypadá stejně jako náhled, včetně zlomu na 2. stranu
- motivační dopis k inzerátu, přizpůsobení životopisu inzerátu, anglická verze (přepínač CZ / EN)
- mobilní rozhraní s ovládáním dole na dosah palce

## Soukromí

- Text se neukládá ani nezapisuje do logů. Posílá se jen do Claude API, které z něj životopis sestaví.
- Bez účtů a bez databáze. Hotový životopis existuje jen v prohlížeči.
- Nahrané soubory se čtou jen v paměti a hned se zahodí.

## Pojistka proti vymýšlení

AI smí formulace jen učesat. Výsledek se pak v kódu (ne přes AI) porovná s tvým textem: firmy, školy, roky, čísla,
dovednosti, jazyky, kontakty a jména. Co v textu nebylo, je v náhledu **žlutě podtržené**, ať to můžeš zkontrolovat.
Stejná kontrola hlídá motivační dopis, přizpůsobení inzerátu i anglickou verzi.

## Placený přístup (Stripe, testovací režim)

Náhled je vždy zdarma. Plný přístup (PDF bez vodoznaku, dopis, přizpůsobení inzerátu, angličtina) je na 1 den zdarma,
na 14 dní nebo na rok, jednorázovou platbou bez automatického obnovení. Bez účtů: přístup je v podepsaném cookie a
krátký kód ho přenese na jiné zařízení. Placené funkce hlídá server.

Stripe běží v testovacím režimu, nic se nestrhne. Testovací karta: **4242 4242 4242 4242**, libovolné budoucí datum a CVC.
Bez `STRIPE_SECRET_KEY` je vše zdarma a o platbách se nic nezobrazuje.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Claude API (`@anthropic-ai/sdk`), zod, Stripe Checkout,
PDF na serveru přes headless Chromium (`puppeteer-core` + `@sparticuz/chromium`). Hosting Railway.

## Kvalita

- Vitest na logiku (pojistka proti vymýšlení, platby, přístup, PDF, AI s mockem)
- Playwright na hlavní průchody na počítači i mobilu: tvorba, šablony, PDF (počet stran a úplnost textu), platby,
  přístupnost (axe, WCAG 2.1 AA), CSP
- GitHub Actions spouští u každého PR lint, typecheck, Vitest, build a Playwright
- Lighthouse (mobil): úvodní stránka 97 / 100 / 100 / 100
- přísná Content-Security-Policy s nonce

## Workflow

- `dev` = staging, `main` = produkce
- každá změna: větev z `dev` → pull request do `dev` → merge jen se zeleným CI
- do `main` merguje jen majitelka repa

## Spuštění

```bash
npm install
cp .env.example .env.local   # doplň ANTHROPIC_API_KEY
npm run dev
```

Bez klíče funguje tlačítko „Ukázka“ (vymyšlená osoba). Testy: `npm run check` (lint, typecheck, Vitest, build, Playwright).

## Nasazení (Railway)

Build `npm run build`, start `npm start` (port z `PORT`). Proměnné prostředí jsou popsané v `.env.example`.

`railpack.json` přidává do běhového obrazu systémové knihovny (`libnss3`, `libnspr4`, …), které potřebuje headless
Chromium pro PDF na serveru. Bez nich PDF padá s chybou `libnspr4.so: cannot open shared object file`. Dřív to řešila
jen proměnná `RAILPACK_DEPLOY_APT_PACKAGES` na Railway, teď je seznam přímo v repu.
