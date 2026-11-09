# Cvéčko

Webová aplikace, která z libovolného textu o tobě udělá moderní životopis v češtině.
Bez formulářů: vložíš starý životopis, poznámky nebo odrážky (nebo nahraješ PDF/Word) a AI (Claude) z toho poskládá
hotový životopis v jedné z pěti šablon (Časopis, Časová osa, Minimal, Blok, Terminál).

- kontrola vymýšlení v kódu: co v tvém textu nebylo, je žlutě podtržené
- text jde přepsat přímo v náhledu, „Vylepšit shrnutí“, motivační dopis k inzerátu ve stejné šabloně
- PDF A4: bez Stripe přes tisk prohlížeče, se Stripe (test mode, 99 Kč) vyrobené na serveru po zaplacení
- mobilní rozhraní s lištou pro palec, přísná CSP s nonce, Lighthouse ≥ 95

## Spuštění

```bash
npm install
cp .env.example .env.local   # doplň ANTHROPIC_API_KEY
npm run dev
```

Bez klíče funguje tlačítko „Ukázka“ (vymyšlená osoba).

## Proměnné prostředí

| Proměnná | Povinná | Popis |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | ano | Klíč ke Claude API (vytváření životopisu a „Vylepšit shrnutí“) |
| `STRIPE_SECRET_KEY` | ne | Stripe klíč (`sk_test_…`). Bez něj je PDF zdarma a o platbě se nic nezobrazuje |
| `APP_URL` | doporučeno | Veřejná adresa webu (OG obrázek, sitemap, návrat ze Stripe) |
| `PDF_RENDER_SECRET` | ne | Tajemství pro interní tiskovou stránku (jinak odvozené ze Stripe klíče) |
| `RATE_LIMIT_SECRET` | ne | Tajemství pro podpis cookie s limitem požadavků |
| `ANALYTICS_URL`, `ANALYTICS_ID` | ne | Měření bez cookies (Plausible / Umami); bez nich se nic nenačte |
| `CHROMIUM_PATH` | jen lokálně/CI | Cesta k Chromiu pro serverové PDF (na Railway se nenastavuje) |

## Testy

```bash
npm run lint
npm run typecheck
npm run test       # Vitest (logika)
npm run test:e2e   # Playwright (hlavní průchody, desktop + mobil, PDF, platba, přístupnost)
npm run check      # vše najednou
```

## Nasazení (Railway)

Build `npm run build`, start `npm start` (port z `PORT`). Větev `dev` = staging, `main` = ostrý web.
