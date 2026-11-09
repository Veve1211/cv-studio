# PROGRESS – noc 3 (před odevzdáním)

Pravidla: fáze v pořadí, každá = větev z `dev` → PR do `dev`, merge (squash) jen se zeleným CI. STOP v 6:00 Europe/Prague.
Po obnovení: zjisti čas, přečti tento soubor, `git status`, `git log`, otevřené PR + CI, pokračuj od posledního nedokončeného kroku.

| Fáze | Větev | PR | Stav |
| --- | --- | --- | --- |
| 1. Prezentační režim | `feat/demo-mode` | #19 | ✅ zmergováno |
| 2. Zjednodušení | `feat/simplify` | #20 | ✅ zmergováno |
| 3. 3 nové šablony (Aura, Švýcar, Bento) | `feat/templates` | #21 | ✅ zmergováno |
| 4. Přizpůsobení inzerátu | `feat/tailor` | PR otevřen | CI běží |
| 5. Angličtina | `feat/english` | PR po merge fáze 4 | hotovo, celé e2e lokálně zelené |
| 6. Placený přístup | – | – | nezačato |
| 7. Ko-fi | – | – | nezačato |

Další konkrétní krok: zmergovat fázi 4 po zeleném CI, přeskládat `feat/english` (fáze 5) na dev + PR. Fáze 6 rozpracovaná ve `feat/access` (server hotový, chybí napojení dialogu ve studiu + e2e).
