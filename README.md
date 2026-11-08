# Cvéčko

Webová aplikace, která z libovolného textu o tobě udělá moderní životopis v češtině.
Bez formulářů: vložíš starý životopis, poznámky nebo odrážky a AI (Claude) z toho poskládá hotový životopis
v jedné z pěti šablon (Časopis, Časová osa, Minimal, Blok, Terminál). Text jde přepsat přímo v náhledu,
PDF se stáhne přes tisk prohlížeče (volitelně za 99 Kč přes Stripe, testovací režim).

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
| `APP_URL` | ne | Veřejná adresa webu pro návrat ze Stripe, např. `https://cvecko.up.railway.app` |

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
