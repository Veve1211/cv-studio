# Bezpečnost

Jak Cvéčko chrání data uživatelů a klíče. Poslední kontrola: 18. 11. 2026.

## Nahlášení chyby

Našel/našla jsi bezpečnostní chybu? Napiš prosím na **paukrtovavera@seznam.cz**, ne do veřejného issue. Odpovím do
několika dní.

## Osobní údaje

- Text, který uživatel vloží, se nikam neukládá a nezapisuje do logů. Posílá se jen do Claude API.
- Bez účtů a bez databáze. Hotový životopis existuje jen v prohlížeči uživatele.
- Nahrané PDF / DOCX se čte jen v paměti (max 5 MB, typ se ověřuje podle obsahu, ne podle přípony) a hned se zahodí.
- Analytika (volitelná) je bez cookies.

## Tajné klíče

- Klíče jsou jen v proměnných prostředí: lokálně `.env.local` (ignoruje ho Git), na serveru Railway Variables.
- V repu je jen `.env.example` s názvy proměnných, bez hodnot.
- Klíče nepatří do kódu, commitů, chatu s AI ani na screenshoty.
- **Kontrola historie (18. 11. 2026):** prošla jsem všech 79 commitů ve všech větvích. Žádný Anthropic ani Stripe
  klíč tam není.

## Ochrana aplikace

- **Content-Security-Policy s nonce:** skripty běží jen s jednorázovým nonce (`src/proxy.ts`, `src/lib/csp.ts`),
  `object-src 'none'`, `frame-ancestors 'none'`. E2E testy hlídají i tichá porušení CSP.
- **Bezpečnostní hlavičky:** `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- **XSS:** veškerý text od uživatele a AI se vykresluje přes React jako text, nikdy `dangerouslySetInnerHTML`.
- **Rate limit** na AI endpointy: podle IP a navíc podepsaným HttpOnly cookie, takže přežije restart serveru.
- **Placené funkce hlídá server** (`requireAccess` vrací 402). Přístup je v podepsaném HttpOnly cookie (HMAC).
- **Interní stránka pro PDF** (`/tisk`) je bez tajné hlavičky neviditelná (404).
- **Validace vstupů** přes zod na všech API routes.

## Platby

Stripe je teď vypnutý: `STRIPE_SECRET_KEY` není nastavený ani na produkci, ani na stagingu. Bez klíče se o platbách
nic nezobrazuje. Pojistka v buildu (`src/lib/legal-check.ts`): když je klíč nastavený a na stránkách obchodních
podmínek nebo reklamací zůstal placeholder (IČO, adresa), build schválně spadne. Tahle pojistka 18. 11. 2026 zastavila
nasazení stagingu, kde klíč pořád zůstal.

## Závislosti

- **`npm audit --omit=dev` (18. 11. 2026): 0 zranitelností** v tom, co běží na serveru.
- Ve vývojových nástrojích (ESLint, Vitest) hlásí `npm audit` zranitelnosti typu ReDoS / DoS v knihovnách
  `minimatch` a `picomatch`. Ty se na server nedostanou a zpracovávají jen naše vlastní soubory. Opravím je s další
  aktualizací nástrojů.
- Knihovny držím na nejnovějších stabilních verzích. Po každém upgradu musí projít celé CI.

## MCP a AI nástroje

- Používám jen oficiální MCP servery nebo vlastní. Žádné neznámé balíčky z npm.
- Až připojím Railway MCP, zakážu v `~/.claude/settings.json` nástroje `list_variables` a `set_variables`, aby AI
  nemohla číst ani měnit proměnné s klíči.

## Workflow

- Každá změna jde přes feature větev a PR do `dev` (staging). Merge jen se zeleným CI: lint, typecheck, Vitest,
  build, Playwright.
- Do `main` (ostrý web) merguje jen majitelka repa, až po kontrole stagingu.
- Po nasazení workflow „Smoke test staging“ ověří živý staging včetně vygenerování PDF.
