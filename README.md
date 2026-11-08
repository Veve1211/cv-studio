# Cvéčko

Webová aplikace, která z libovolného textu o tobě udělá moderní životopis v češtině.
Bez formulářů: vložíš starý životopis, poznámky nebo odrážky a AI (Claude) z toho poskládá hotový životopis.

## Spuštění

```bash
npm install
cp .env.example .env.local   # doplň ANTHROPIC_API_KEY
npm run dev
```

## Testy

```bash
npm run test       # Vitest (logika)
npm run test:e2e   # Playwright (hlavní průchody, desktop + mobil)
npm run check      # lint + typecheck + testy + build + e2e
```

## Nasazení

Railway: `npm run build` a `npm start` (port bere z proměnné `PORT`).
