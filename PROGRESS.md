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
| 6. Placený přístup | `feat/access` | PR otevřen | CI běží (lokálně celé e2e zelené) |
| 7. Ko-fi | `feat/kofi` (nad fází 6) | PR po merge fáze 6 | hotovo lokálně, e2e zelené |

Další konkrétní krok: zmergovat fázi 6 po zeleném CI; přeskládat `feat/kofi` (fáze 7, hotová) + PR; pak NIGHT_REPORT_3.md (koncept v /tmp/claude-0/report).
