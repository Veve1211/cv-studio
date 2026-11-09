# PROGRESS – noc 3 (před odevzdáním)

Pravidla: fáze v pořadí, každá = větev z `dev` → PR do `dev`, merge (squash) jen se zeleným CI. STOP v 6:00 Europe/Prague.
Po obnovení: zjisti čas, přečti tento soubor, `git status`, `git log`, otevřené PR + CI, pokračuj od posledního nedokončeného kroku.

| Fáze | Větev | PR | Stav |
| --- | --- | --- | --- |
| 1. Prezentační režim | `feat/demo-mode` | #19 | ✅ zmergováno |
| 2. Zjednodušení | `feat/simplify` | #20 | ✅ zmergováno |
| 3. 3 nové šablony (Aura, Švýcar, Bento) | `feat/templates` | #21 | ✅ zmergováno |
| 4. Přizpůsobení inzerátu | `feat/tailor` | #22 | ✅ zmergováno |
| 5. Angličtina | `feat/english` | PR otevřen | CI běží |
| 6. Placený přístup | `feat/access` (nad fází 5) | – | hotovo lokálně, běží celé e2e |
| 7. Ko-fi | – | – | nezačato |

Další konkrétní krok: zmergovat fázi 5 po zeleném CI; pak přeskládat `feat/access` (fáze 6: hotová lokálně, cílené e2e zelené) a otevřít PR; potom fáze 7 Ko-fi a NIGHT_REPORT_3.md.
