# PROGRESS – noc 3 (před odevzdáním)

Pravidla: fáze v pořadí, každá = větev z `dev` → PR do `dev`, merge (squash) jen se zeleným CI. STOP v 6:00 Europe/Prague.
Po obnovení: zjisti čas, přečti tento soubor, `git status`, `git log`, otevřené PR + CI, pokračuj od posledního nedokončeného kroku.

| Fáze | Větev | PR | Stav |
| --- | --- | --- | --- |
| 1. Prezentační režim | `feat/demo-mode` | #19 | ✅ zmergováno |
| 2. Zjednodušení | `feat/simplify` | #20 | ✅ zmergováno |
| 3. 3 nové šablony (Aura, Švýcar, Bento) | `feat/templates` | #21 | ✅ zmergováno |
| 4. Přizpůsobení inzerátu | `feat/tailor` | #22 | ✅ zmergováno |
| 5. Angličtina | `feat/english` | #23 | ✅ zmergováno |
| 6. Placený přístup | `feat/access` | #24 | ✅ zmergováno |
| 7. Ko-fi + NIGHT_REPORT_3.md | `feat/kofi` | #25 | ✅ zmergováno |

Všech 7 fází je hotových a zmergovaných do `dev`.

## Ověření na Railway (10. 11. 2026)

- Skutečná AI funguje (Chaotický text → životopis), prezentační režim (`DEMO_ENABLED=1`) funguje.
- Stripe sandbox funguje: pokladna se otevře a testovací platba projde.
- PDF na serveru padalo: Chromium nemělo systémové knihovny (`libnspr4.so`). Opraveno na Railway proměnnou
  `RAILPACK_DEPLOY_APT_PACKAGES`; stejný seznam je teď v repu v `railpack.json` (viz README, Nasazení).
- Dialog platby: pod vypnutým tlačítkem „Zaplatit“ je nápověda „Pro pokračování zaškrtni oba souhlasy.“
- Ceník na landingu: „Za 99 Kč“ / „Za 299 Kč“ vedou do aplikace s nápovědou „Nejdřív si vytvoř životopis…“ a tarif je v dialogu platby předvybraný (platí se až při stažení PDF).
