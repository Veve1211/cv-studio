@AGENTS.md

# CLAUDE.md

Živý dokument. Průběžně aktualizuj, udržuj krátký.

## Projekt
- Název: Cvéčko (repo `cv-studio`)
- Webová aplikace: uživatel vloží libovolný text o sobě, AI (Claude) z něj udělá hotový životopis v moderních šablonách. Bez formulářů.
- Cíl: výrazně modernější než klasické generátory životopisů. Nekopíruj vzhled ani texty jiných služeb.
- Jazyk UI: čeština, tón přátelský. Mobile first.

## Stack
- Next.js 16 (App Router, `src/`, Cache Components vypnuté kvůli CSP nonce), React 19, TypeScript, Tailwind 4
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
- `DEMO_ENABLED` na produkci jen na dobu prezentace, pak hned smazat (prezentační režim odemyká vše a zvyšuje AI limity).
- Tajné klíče jen v proměnných prostředí (`.env.local` lokálně, Railway Variables). Nikdy v kódu ani commitech.
- Kód, komentáře, commity anglicky (`feat: ...`, `fix: ...`). UI texty česky.
- Knihovny: nejnovější stabilní verze, nic deprecated.
- Nikdy nenechávej v UI placeholder.
- Funkce jsou zmrazené (od 2026-11-23): žádné nové funkce, dokud Cvéčko nemá první skutečné uživatele. Jen opravy, výkon, přístupnost, úklid a měření.
- Před merge do main: zelené `npm run test:e2e` (Playwright + Chromium, Chrome DevTools MCP v cloudu není) a Veve zkontroluje staging na mobilu.

## Příkazy
- `npm run dev`, `npm run build`, `npm start`
- `npm run lint`, `npm run typecheck`, `npm run test` (Vitest), `npm run test:e2e` (Playwright)
- `npm run check` = vše najednou
- Lokálně v cloud sandboxu: `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome npm run test:e2e`
- E2E běží s `E2E_MOCK_AI=1` (API vrací ukázková data, žádné volání Claude).

## Struktura
- `src/app/` – stránky (`/`, `/soukromi`, 404, error) a API routes (`/api/cv`, `/api/summary`, `/api/checkout`, `/api/checkout/verify`)
- `src/components/site/` – hlavička, patička, landing; `studio/` – aplikace; `templates/` – 8 šablon + miniatury; `preview/` – A4 náhled
- `src/lib/` – logika (schéma životopisu, volání AI, šablony)
- `e2e/` – Playwright testy; `*.test.ts` vedle kódu – Vitest
- `.github/workflows/ci.yml` – CI

## Architektura v kostce
- Pojistka proti vymýšlení je v kódu, ne v AI: `src/lib/cv/grounding.ts` (+ `checkFreeText`, `checkTranslation`).
- CSP s nonce v `src/proxy.ts` / `src/lib/csp.ts`, proto jsou všechny stránky dynamické.
- Podepsané HttpOnly cookies (HMAC): rate limit, prezentační režim, přístup, den zdarma.
- PDF: tisk prohlížeče; se Stripe serverové PDF přes headless Chromium a interní `/tisk`.
- Limity AI: podle IP + cookie, globální denní strop `AI_DAILY_LIMIT`.

## Rozhodnutí
- Deník rozhodnutí s datem je v `docs/decisions.md`. Před změnou oblasti si přečti související záznamy, nové rozhodnutí zapiš tam (jeden řádek, datum, proč).
- Vysvětlení hlavních rozhodnutí jednoduše česky: `docs/proc.md`.
