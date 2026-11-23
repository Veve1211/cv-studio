# Proč je Cvéčko udělané takhle

Krátké odpovědi na otázky, které padnou při pohovoru nebo code review („vysvětli mi tenhle kód“).
Každá odpověď má tři části: co to je, proč to tak je a kde to v kódu najdeš. Podrobnosti s datem jsou
v [`decisions.md`](decisions.md).

## 1. Proč je pojistka proti vymýšlení v kódu, a ne v AI?

**Co:** Po vygenerování životopisu projde kód každou firmu, školu, rok, číslo, dovednost, jazyk, kontakt
a jméno a hledá je v původním textu uživatele. Co tam nenajde, žlutě podtrhne.

**Proč:** AI se nedá stoprocentně věřit, že si nic nevymyslí, ani když jí to zakážu v zadání. Kontrola
v obyčejném kódu dá pokaždé stejný výsledek, dá se otestovat a nic nestojí. Proto ji neprovádí AI,
ale kód. Musí počítat s češtinou („v Brně“ = „Brno“), proto porovnává začátky slov a má malou
tabulku synonym (řidičák, vyučen, maturita).

**Kde:** `src/lib/cv/grounding.ts`, testovací vstupy v `grounding.fixtures.ts`.

## 2. Proč CSP s nonce?

**Co:** Content Security Policy říká prohlížeči, které skripty smí na stránce běžet. Nonce je náhodný
kód, který server pro každé načtení stránky vymyslí znovu a přidá ho jen ke svým vlastním skriptům.

**Proč:** Kdyby se do stránky nějak dostal cizí skript (třeba přes text od uživatele), prohlížeč ho
bez správného nonce nespustí. Je to druhá pojistka vedle toho, že text vykresluju jen jako text,
nikdy jako HTML. Cena: každá stránka se musí vyrobit na serveru znovu (nonce se nedá uložit dopředu).

**Kde:** `src/proxy.ts`, `src/lib/csp.ts`.

## 3. Proč podepsané cookies (HMAC), když nemám databázi?

**Co:** Některé věci si server potřebuje pamatovat (kolik pokusů jsi dnes udělal, jestli máš přístup).
Uloží je do cookie v prohlížeči a podepíše je tajným klíčem. Podpis se nedá vyrobit bez klíče.

**Proč:** Bez databáze to jinak nejde a cookie si uživatel může upravit. Podpis zaručí, že server
pozná, když ji někdo změní. `HttpOnly` znamená, že ji nepřečte ani JavaScript na stránce.

**Kde:** `src/lib/rate-limit-cookie.ts`, `src/lib/access.ts`, `src/lib/demo.ts`, `src/lib/cookies.ts`.

## 4. Proč tolik limitů na volání AI?

**Co:** Limit podle IP adresy, limit v cookie a navíc denní strop pro všechny návštěvníky dohromady.

**Proč:** Každé volání AI stojí peníze. Limit podle IP jde obejít jinou sítí, cookie jde smazat.
Denní strop je pojistka, která platí vždycky. Poslední pojistka je mimo kód: limit v Anthropic
Console a vypnuté automatické dobíjení kreditu.

**Kde:** `src/lib/rate-limit.ts`, `src/lib/ai-limit.ts`, `src/lib/ai-budget.ts`.

## 5. Proč se text uživatele nikam neukládá?

**Co:** Text se pošle jen do Claude API, životopis žije v prohlížeči. Žádná databáze, žádné účty, žádné logy.

**Proč:** Životopis jsou osobní údaje. Co neuložím, nemůže uniknout, a nemusím řešit, jak dlouho to
smím držet. Pro uživatele je to i jednodušší: nic se neregistruje.

## 6. Proč server nevěří prohlížeči (platby, PDF)?

**Co:** Placené funkce (PDF bez vodoznaku, dopis, angličtina) kontroluje server, ne tlačítko v prohlížeči.
Serverové PDF před vytvořením znovu ověří platbu u Stripe.

**Proč:** Všechno, co běží v prohlížeči, si uživatel může přes vývojářské nástroje změnit. Skrytí
tlačítka nic nechrání, ochrana musí být na serveru.

**Kde:** `src/lib/require-access.ts`, `src/app/api/pdf/`.

## 7. Proč API přijímá jen JSON?

**Co:** Endpointy odmítnou požadavek, který nemá hlavičku `Content-Type: application/json`.

**Proč:** Obyčejný HTML formulář z cizího webu umí poslat požadavek na můj server, ale ne jako JSON.
Tím jednoduše zablokuju, aby cizí stránka posílala požadavky jménem mých návštěvníků.

**Kde:** `readJson` v `src/lib/http.ts`.

## 8. Proč testy s axe a kontrolou PDF?

**Co:** E2E testy v Playwrightu projdou všech 8 šablon nástrojem axe (přístupnost) a z PDF přečtou
text, jestli se nic neuřízlo.

**Proč:** Ručně bych osm šablon na mobilu i počítači pokaždé nezkontrolovala. Testy to udělají při
každé změně. Zelené testy ale neznamenají funkční web, proto se staging ještě kontroluje na mobilu.

**Kde:** `e2e/`.

## 9. Proč se ukázky šablon na úvodu kreslí až po načtení?

**Co:** Tři miniatury v úvodu se nejdřív ukážou jako prázdný papír a obsah se dokreslí, až je stránka načtená.

**Proč:** Každá šablona má vlastní písmo. Stahovala se hned na začátku a zdržovala nadpis na mobilu.
Po změně se úvod na mobilu vykreslí o 1,2 s dřív (Lighthouse 71–74 → 79–84).

**Kde:** `src/components/site/landing-showcase.tsx`.
