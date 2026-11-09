@AGENTS.md

# CLAUDE.md

Živý dokument. Průběžně aktualizuj, udržuj krátký.

## Projekt
- Název: Cvéčko (repo `cv-studio`)
- Webová aplikace: uživatel vloží libovolný text o sobě, AI (Claude) z něj udělá hotový životopis v moderních šablonách. Bez formulářů.
- Cíl: výrazně modernější než klasické generátory životopisů. Nekopíruj vzhled ani texty jiných služeb.
- Jazyk UI: čeština, tón přátelský. Mobile first.

## Stack
- Next.js 16 (App Router, `src/`, Cache Components zapnuté), React 19, TypeScript, Tailwind 4
- Claude API (`@anthropic-ai/sdk`, model `claude-opus-5-5`), validace `zod`
- Stripe Checkout (jen test mode, volitelné): bez `STRIPE_SECRET_KEY` je PDF zdarma a o platbě se nic neukazuje
- Bez databáze, bez účtů. Hosting Railway (`npm start`, port z `PORT`).

## Větve a nasazení
- `dev` = staging, `main` = ostrý web.
- Práce vždy na feature větvi z `dev` → PR do `dev`.
- Do `main` merguje jen Veve. Nikdy nepushuj ani nemerguj do `main`.
- PR do `dev` smí být zmergovaný (squash), jen když projde CI: lint, typecheck, Vitest, build, Playwright (desktop + mobil).

## Pravidla
- Osobní údaje: text uživatele nikde neukládej a nelogguj. Posílá se jen do Claude API. Životopis žije jen v prohlížeči.
- AI nesmí přidat zkušenost, firmu, dovednost ani údaj, který v textu není. Smí jen učesat formulace.
- Veškerý text od uživatele/AI vykresluj jako text (React), nikdy `dangerouslySetInnerHTML`.
- Tajné klíče jen v proměnných prostředí (`.env.local` lokálně, Railway Variables). Nikdy v kódu ani commitech.
- Kód, komentáře, commity anglicky (`feat: ...`, `fix: ...`). UI texty česky.
- Knihovny: nejnovější stabilní verze, nic deprecated.

## Příkazy
- `npm run dev`, `npm run build`, `npm start`
- `npm run lint`, `npm run typecheck`, `npm run test` (Vitest), `npm run test:e2e` (Playwright)
- `npm run check` = vše najednou
- Lokálně v cloud sandboxu: `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome npm run test:e2e`
- E2E běží s `E2E_MOCK_AI=1` (API vrací ukázková data, žádné volání Claude).

## Struktura
- `src/app/` – stránky (`/`, `/soukromi`, 404, error) a API routes (`/api/cv`, `/api/summary`, `/api/checkout`, `/api/checkout/verify`)
- `src/components/site/` – hlavička, patička, landing; `studio/` – aplikace; `templates/` – 5 šablon + miniatury; `preview/` – A4 náhled
- `src/lib/` – logika (schéma životopisu, volání AI, šablony)
- `e2e/` – Playwright testy; `*.test.ts` vedle kódu – Vitest
- `.github/workflows/ci.yml` – CI

## Rozhodnutí
- 2026-11-08: název Cvéčko; Next.js scaffold z create-next-app 16.4.5; TypeScript 5 a ESLint 9 ponechány podle šablony create-next-app (oficiálně podporovaná kombinace)
- 2026-11-08: Tailwind loader jen pro `globals.css` (širší pravidlo rozbíjí CSS moduly šablon)
- 2026-11-08: šablony = React komponenty + CSS moduly v mm/pt, akcent přes `--accent`; barvy s kontrastem AA (test); výchozí šablona Časopis
- 2026-11-08: písma přes `next/font/google` (self-hosted, žádné volání Googlu z prohlížeče)
- 2026-11-08: PDF = tisk prohlížeče (`window.print`), `@page` A4: 1. strana bez okrajů, další 14/12 mm; okraje mají barvu papíru (`@page { background }`); e2e kontroluje počet stran a úplnost textu přes pdfjs
- 2026-11-08: platba = přesměrování na Stripe Checkout; životopis se na dobu platby uloží jen do `sessionStorage` okna a po návratu se hned smaže (jinak by se ztratil); ověření přes `/api/checkout/verify`; Ctrl+P při zamčení tiskne jen upozornění (klientská ochrana, dá se obejít přes devtools – OK pro ukázku)
- 2026-11-08: `APP_URL` (volitelné) = adresa pro návrat ze Stripe; bez ní se bere z požadavku
- 2026-11-08: přístupnost hlídá axe (WCAG 2.1 AA) v e2e na všech šablonách; šedé texty v šablonách musí mít kontrast ≥ 4.5:1
- 2026-11-08: bezpečnostní hlavičky v `next.config.ts` (nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy); plná CSP zatím ne (Next vkládá inline skripty, chtělo by to nonce)
- 2026-11-09: vzhled aplikace světle modrý a modernější (Veve): tokeny `brand*` v `globals.css`, hlavní tlačítka `.btn-primary` (světle modrá + tmavě modrý text), nadpisy Space Grotesk; 7. barva životopisu „Nebeská“ je výchozí
