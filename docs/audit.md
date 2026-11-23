# Audit: případová studie (listopad 2026)

Audit hotové aplikace před odevzdáním do portfolia. Cíl: najít, co uživatelům nebo provozu reálně
vadí, opravit jen levné a bezpečné věci a u každé změny ukázat ověření nebo čísla.

## Postup

1. **Fáze 1 – průzkum.** Aplikace prošlá z pohledu uživatele i lektora (pravdivost textů, náklady
   na AI), Lighthouse, řádek po řádku serverové části s největším rizikem: `proxy.ts` (CSP,
   ochrana `/tisk`), generování PDF, nahrávání souborů, podepsané cookies a přístup.
2. **Fáze 2 – návrh.** Každý nález dostal závažnost, odhad práce a návrh řešení; Veve schválila,
   co se dělá hned.
3. **Fáze 3 – quick wins.** Každá oprava zvlášť ve feature větvi z `dev`, s testem, PR do `dev`.
   Do `main` merguje jen Veve.

## Co se udělalo

| Oblast | Problém | Řešení | Ověření | PR |
|---|---|---|---|---|
| Náklady na AI | Limit podle IP a cookie jde obejít, útrata nemá strop | Společný denní limit volání AI (`AI_DAILY_LIMIT`, výchozí 300), po vyčerpání česká hláška (503) | 3 nové testy | #43 |
| Pravdivé texty | „Nic si nevymýšlí“ slibovalo víc, než AI zaručí | Texty říkají, co se opravdu děje: co AI doplní navíc, označíme žlutě | e2e text FAQ upravený | #43 |
| Ukázková CV | Roky praxe neseděly s daty | Opravené roky (stav 2026) | – | #43 |
| Nahrávání | Kontrola velikosti spoléhala na `Content-Length`; chunked požadavek by se načetl celý | Upload bez `Content-Length` → 411 | Vitest 147/147 | #44 |
| Nahrávání | DOCX je ZIP – „zip bomba“ by se rozbalila do paměti | Před rozbalením se sečtou velikosti z centrálního adresáře ZIPu, max 30 MB, ZIP64 odmítnut | 2 nové testy | #44 |

V pořádku bez změny: HMAC podpisy s oddělenými účely a porovnáním odolným vůči měření času,
`/tisk` jen s tajnou hlavičkou, šablony nenačítají obrázky z adres od uživatele (serverový Chromium
nejde zneužít na dotazy do vnitřní sítě), max 2 souběžné rendery PDF.

## Co se změřilo a nedělá se

**C5 – `browserslist`.** Předpoklad: nastavení cílových prohlížečů v `package.json` odstraní
zbytečné polyfilly. Měření (úvodní stránka, skripty, které stáhne moderní prohlížeč, produkční build):

| Cílové prohlížeče | JS úvodní stránky | CSS celkem |
|---|---|---|
| bez nastavení (výchozí Next: Chrome/Edge/Firefox 111, Safari 16.4) | 687 156 B (202 784 B gzip) | 82 988 B |
| Chrome/Edge/Firefox 130, Safari 18 | beze změny | 81 452 B (−1 536 B) |

Proč: balík polyfillů core-js má `noModule`, takže ho moderní prohlížeč vůbec nestáhne. Zbytek
jsou vestavěné polyfilly Next.js v hlavním chunku (~1,4 kB, 0,6 kB gzip), které `browserslist`
neovlivní. Vyšší cíl by ušetřil 1,5 kB CSS, ale vyřadil by starší iPhony (Safari 16.4–17), na kterých
si lidé životopis často dělají. **Rozhodnutí: beze změny.** Stejný výsledek vyšel i v Českém králi.

## Co zůstává

- Po sloučení #43: v Anthropic Console nastavit měsíční spending limit (tvrdá pojistka nad denním stropem v kódu).
- Zbytkové riziko u DOCX (podvržené velikosti v ZIPu) je popsané v `SECURITY.md`.

## Co si z toho beru

- Měřit před opravou: úspora z `browserslist` vypadala jistě a vyšla nulová.
- U aplikace s AI je největší provozní riziko útrata, ne výkon – strop patří do kódu i do konzole poskytovatele.
- Sliby na webu musí odpovídat tomu, co technika opravdu zaručí.

## Druhé kolo (23. 11. 2026, PR do `dev` po #45)

Celé měření znovu (lokální build v cloud sandboxu): build, lint, typecheck, Vitest, Playwright, `npm audit`,
Lighthouse 3×. Výchozí stav: vše zelené, Vitest 150/150, Playwright 226 prošlo / 0 selhalo (50 přeskočeno
záměrně), `npm audit` 0.

| Oblast | Problém | Řešení | Před → po |
|---|---|---|---|
| Serverové PDF | Renderovací Chromium posílal tajnou hlavičku `/tisk` na každý server, i na analytiku (s `ANALYTICS_URL`) | Hlavička jen na vlastní server, cizí požadavky zablokované | pokus s falešnou analytikou: 8 z 8 renderů s tajemstvím → 0 z 8 |
| Cizí formuláře | API četlo tělo bez ohledu na `Content-Type`; cizí web mohl z prohlížeče návštěvníka poslat `text/plain` formulář na `/api/cv` a čerpat AI | `readJson` bere jen `application/json` | `text/plain` → 200 → 400, aplikace dál 200 |
| Psaní do pole | Každé písmeno překreslilo náhled i 8 miniatur šablon | `memo` pro šablony a výběr šablon | 37 znaků při CPU 4×: 2,23–2,30 s → 1,83–2,00 s, medián klávesy 56 → 40–48 ms |
| Úklid | Mrtvé funkce (`yearOf`, `initials`, `isEmptyCv`), čtení cookie ve 3 souborech, slogan napsaný třikrát | Smazáno, `src/lib/cookies.ts`, `SITE_TAGLINE` | −63 / +40 řádků |
| Chyby | Chyběl `global-error.tsx` (chyba v samotném layoutu) | Česká záchranná stránka | – |
| Dokumentace | Časové limity AI v `CLAUDE.md` 150/120 s, v kódu 65/55 s; Lighthouse 97 neodpovídal | Opraveno | – |

Po kole: Vitest 156/156, Playwright 226 / 0 selhalo, lint, typecheck a build zelené.

**Změřeno a vráceno:** přednačtení písma nadpisu (Space Grotesk). FCP 2,9 → 2,4 s, ale LCP 4,8 → 5,1 s a
skóre se nezlepšilo. **Vlastní chyba v měření:** první měření psaní ukázalo „2× víc pomalých událostí“, šlo
o dva posluchače v měřicím skriptu; skutečný rozdíl je v tabulce.

**Lighthouse úvod mobil: 70–74 / 100 / 100 / 100** (LCP 4,8 s), desktop 96 / 100 / 100 / 100. Brzdí hlavně
9 písem na úvodu (asi 385 KB), protože ukázky šablon používají jejich písma.

**Ověřeno na stagingu: limit pokusů podle IP funguje.** Limit bere první adresu z `X-Forwarded-For` a hrozilo,
že ji jde na Railway podvrhnout, nebo že všichni sdílí adresu proxy. Test ze sandboxu byl nejednoznačný (37 požadavků
prošlo i přes limit 30, nejspíš kvůli měnící se odchozí IP sandboxu). Proto `/api/health?client=1` (jen se smoke
tokenem, #48) a smoke test z GitHubu:

| Požadavek | Klíč limitu | `X-Forwarded-For` na serveru | `X-Real-IP` |
|---|---|---|---|
| obyčejný | adresa runneru | runner, Railway edge | runner |
| s podvrženými `X-Forwarded-For` / `X-Real-IP` | adresa runneru | runner, Railway edge | runner |

Railway edge podvržené hlavičky přepíše, klíč je skutečná adresa návštěvníka a každý má vlastní limit.
`RATE_LIMIT_DISABLED` na stagingu není. **Rozhodnutí: `clientKey` beze změny.** Diagnostika zůstává v smoke
testu, kdyby Railway chování změnil.

**Zbývá:**
- Pokud je na produkci `ANALYTICS_URL`, po nasazení vyměnit `PDF_RENDER_SECRET`.
- Zrychlit úvod na mobilu (písma ukázek načítat později), `error.tsx` na `retry()`, rozdělit `cv-studio.tsx`.
