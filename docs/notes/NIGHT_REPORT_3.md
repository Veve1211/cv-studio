# Noční report 3 – Cvéčko před odevzdáním

Datum: noc 9.–10. 11. 2026 · Heslo: **jednoduše a překrásně**. Priorita: spolehlivý staging (Railway, větev `dev`).
Světle modrý vzhled zůstal, nic se nepřebarvovalo.

## Ráno za 30 minut (nejdřív tohle)

1. Na Railway (služba stagingu, větev `dev`) nastav proměnnou **`DEMO_ENABLED=1`** a dej **Deploy**.
2. Zkontroluj, že je nastavený **`ANTHROPIC_API_KEY`**. Bez něj AI nefunguje. Aplikace nespadne, jen ukáže českou hlášku a „Zkusit znovu“.
3. Otevři staging s **`?demo=1`** na konci, např. `https://<tvuj-staging>.up.railway.app/?demo=1`.
   - Vlevo nahoře nad „Tvůj životopis“ musí být modrý odznak **„🎤 Prezentační režim · vše odemčené do HH:MM“**.
   - Odemčení platí **3 hodiny a jen v tomto prohlížeči**. Otevři odkaz na počítači, ze kterého budeš prezentovat, nejdřív 3 hodiny před prezentací (nebo ho otevři znovu, prodlouží se).
   - Když místo odznaku uvidíš červenou hlášku „Prezentační režim není na serveru zapnutý“, chybí `DEMO_ENABLED=1` nebo ještě neproběhl deploy.
4. Projdi jednou celý scénář níže nanečisto (cca 5 minut).

## Scénář prezentace (krok za krokem)

Celé to trvá 4–6 minut. Na počítači, okno prohlížeče přes celou obrazovku.

1. **Úvod (landing).** Otevři `…/?demo=1`. Ukaž nadpis a sjeď kousek dolů na **„Před a po“** (neučesaný text se sám poskládá do životopisu).
   Řekni: *„Žádný formulář. Vložíš, co o sobě víš, a AI z toho udělá hotový životopis.“*
2. Klikni nahoře na **„Vytvořit životopis“**. Stránka skočí k aplikaci.
3. **Chaotický text.** Pod textovým polem klikni na čip **„Chaotický text“**.
   Do pole se vloží záměrně neučesaný text (bez diakritiky, s překlepy, vykřičníky…). Řekni: *„Takhle lidé opravdu píšou.“*
4. Klikni na **„Vytvořit životopis“** (modré tlačítko pod polem).
   Ukážou se 3 kroky načítání (Čtu tvůj text → Hledám praxi a vzdělání → Skládám životopis). S AI to trvá zhruba 10–30 s.
5. **Výsledek v šabloně Aura.** Ukaž zelený pruh **„✓ Firmy, školy, roky, čísla i dovednosti sedí s tvým textem“**.
   Řekni: *„AI si nesmí nic vymyslet. Kontrolu dělá kód, ne AI. Co by v textu nebylo, podtrhne žlutě.“*
6. **Šablony a barvy.** Nahoře klikni postupně na **Švýcar**, **Bento** a zpátky na **Aura**. Pak klikni na jednu barvu (např. korálovou) a zpátky na první modrou.
7. **Úprava.** Klikni do textu v životopise (např. na titulek pod jménem), přepiš ho a klikni vedle. *„Všechno se dá přepsat přímo v náhledu.“*
8. **Přizpůsobit inzerátu.** Sjeď pod životopis na **„Co dál?“** a na kartě **„Přizpůsobit inzerátu“** klikni na tlačítko. Vlož tento inzerát (vymyšlená firma):

   ```
   Kavárna U Modré konvice v Brně hledá specialistku nebo specialistu na sociální sítě. Náplň: správa Instagramu, tvorba příspěvků v Canvě, objednávky a komunikace se zákazníky. Požadujeme zkušenost se sociálními sítěmi, Canvu, angličtinu B1 a řidičský průkaz B. Výhodou je znalost Photoshopu.
   ```

   Klikni **„Přizpůsobit životopis“**. Nad životopisem se objeví **„🎯 Přizpůsobeno inzerátu“** se zelenými „máš“ a žlutými „chybí ti“ (jen pro informaci).
   Řekni: *„AI jen přeskupí, co už máš. Nic nepřidá. Co chybí, ti řekne na rovinu.“*
9. **Motivační dopis.** V panelu klikni **„✉️ Napsat dopis k tomuto inzerátu“**. Inzerát už je předvyplněný → **„Napsat motivační dopis“**.
   Dopis je ve stejném vzhledu. Nad ním je přepínač **Životopis / Motivační dopis**.
10. **Angličtina.** V liště nad náhledem klikni na **EN**. Životopis (i dopis) se přeloží, nadpisy sekcí jsou anglicky, jména a firmy zůstanou. Klikni **CZ** a zpátky **EN**: přepíná se okamžitě, bez čekání na AI.
11. **PDF.** Klikni **„Stáhnout PDF“** → v dialogu tisku zvol **Cíl: Uložit jako PDF** → Uložit. PDF vypadá přesně jako náhled, bez vodoznaku.
12. **(Volitelně) Mobil.** Na telefonu otevři stejnou adresu s `?demo=1` (odemčení je pro každý prohlížeč zvlášť). Dole je lišta **Text / Náhled** a hlavní tlačítko na dosah palce.

### Plán B, když něco zlobí

- **AI hlásí chybu nebo je pomalá:** v červeném rámečku klikni **„Zkusit znovu“**. Pokud AI nejde vůbec, klikni na **„Ukázka“** vedle tlačítka „Vytvořit životopis“: hotový ukázkový životopis se ukáže hned, bez AI, a šablony, barvy, úpravy i PDF fungují dál.
- **Chybí odznak prezentačního režimu:** zkontroluj `DEMO_ENABLED=1` a deploy, pak znovu otevři odkaz s `?demo=1`.
- **Dialog „Odemkni plný přístup“** (jen když je zapnutý Stripe a nejsi v prezentačním režimu): zavři ho a otevři znovu odkaz s `?demo=1`.

## Co je hotové a zmergované do `dev`

Každá fáze = vlastní větev → PR do `dev` → squash merge až po zeleném CI (lint, typecheck, Vitest, build, Playwright desktop i mobil).

| Fáze | PR | Co přinesla |
| --- | --- | --- |
| 1. Prezentační režim | [#19](https://github.com/Veve1211/cv-studio/pull/19) | `DEMO_ENABLED=1` + `?demo=1` odemkne vše na 3 h jen v tomto prohlížeči (podepsaný HttpOnly cookie, ověřuje server). Čip „Chaotický text“. Chyba AI = česká hláška + „Zkusit znovu“, časové limity. Oprava pojistky (velké slovo na začátku věty). e2e celého scénáře na desktopu i mobilu. |
| 2. Zjednodušení | [#20](https://github.com/Veve1211/cv-studio/pull/20) | Vidět jen pole + nahrání, Vytvořit, šablona, barva, Stáhnout PDF. Zpět a Vylepšit shrnutí v menu „Další možnosti“. Karty „Co dál?“ pod životopisem. |
| 3. Aura, Švýcar, Bento | [#21](https://github.com/Veve1211/cv-studio/pull/21) | 3 nové šablony na začátku výběru, Aura výchozí, miniatury na landingu. Zlomy na 2. stranu, 7 barev, axe AA, PDF = náhled, i pro dopis. |
| 4. Přizpůsobení inzerátu | [#22](https://github.com/Veve1211/cv-studio/pull/22) | AI jen přeskupí (kód vynutí, že nic nepřibude ani nezmizí) a upraví shrnutí (hlídá pojistka). „Inzerát chce a máš / Chybí ti“, „Vrátit původní pořadí“, inzerát se nabídne pro dopis. |
| 5. Angličtina | [#23](https://github.com/Veve1211/cv-studio/pull/23) | Přepínač CZ / EN u životopisu i dopisu, obě verze v paměti, přepínání bez AI. Jména, firmy a kontakty se v kódu nikdy nepřeloží, čísla a roky hlídá pojistka. |
| 6. Placený přístup | [#24](https://github.com/Veve1211/cv-studio/pull/24) | Jen se `STRIPE_SECRET_KEY`. Náhled zdarma; plný přístup (PDF bez vodoznaku, dopis, přizpůsobení, angličtina) hlídá server. 1 den zdarma (jednou na prohlížeč), 14 dní, 1 rok, jednorázově bez obnovování. Bez účtů: podepsaný cookie + kód „Mám kód“ pro jiné zařízení. Ceník se 3 kartami, souhlasy před platbou, `/obchodni-podminky` a `/reklamace` s `[DOPLNIT]`. |
| 7. Ko-fi | PR s tímto reportem | Jen s `KOFI_URL`: „Kup mi kafe ☕“ v patičce a jemná výzva po stažení PDF. Obyčejný odkaz do nové záložky, žádné skripty z Ko-fi. |

Pokud v době čtení PR fáze 7 ještě není zmergovaný, čeká jen na CI. Prezentaci nijak neovlivňuje.

## Co zůstalo otevřené / co je na tobě

- **Obchodní podmínky a reklamace** mají místo údajů značky `[DOPLNIT]` (provozovatel, IČO, adresa, e-mail, DPH, lhůty, odstoupení). Nic jsem nevymýšlel. Před skutečným prodejem je doplň a nech zkontrolovat právníkem.
- **Ceny** jsou z proměnných `PRICE_14D_CZK` a `PRICE_YEAR_CZK`. Bez nich platí 99 Kč / 14 dní a 299 Kč / rok (moje volba, uprav podle sebe).
- **Skutečné volání AI** jsem nemohl vyzkoušet (v sandboxu není klíč). Všechny testy běží s ukázkovými odpověďmi. Proto ráno projdi scénář nanečisto.

## Rizika

- **Rychlost AI:** vytvoření životopisu ~10–30 s, překlad do angličtiny (životopis i dopis najednou) může trvat i 30–60 s. Prohlížeč čeká max. 150 s, pak ukáže hlášku a „Zkusit znovu“.
- **Prezentační režim platí jen v jednom prohlížeči a 3 hodiny.** Na jiném zařízení otevři odkaz s `?demo=1` znovu.
- **Pojistka proti vymýšlení je heuristika.** U silně přeformulovaných textů může podtrhnout něco zbytečně; je to pomůcka, ne záruka.
- **Přizpůsobení inzerátu:** „máš“ se ukáže jen tehdy, když AI požadavek doloží přesnou citací z životopisu. Když AI cituje volněji, skončí požadavek v „chybí ti“ (raději opatrně než nepravdivě).
- **Placený přístup bez účtů:** kdo smaže cookies, ztratí přístup v tom prohlížeči (vrátí ho kód). Den zdarma jde po smazání cookies získat znovu. Bez databáze to jinak nejde.
- **Serverové PDF** (jen se Stripe a zaplaceným přístupem) potřebuje na Railway aspoň 1 GB RAM. V prezentačním režimu se používá tisk prohlížeče, takže se prezentace netýká.
- **Do `main` jsem nic nemergoval ani nepushoval.**

## Proměnné na Railway (staging)

| Proměnná | Povinná | Hodnota / poznámka |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | **ano** | klíč z console.anthropic.com |
| `DEMO_ENABLED` | **na prezentaci ano** | `1` (pak otevři `…/?demo=1`). Po prezentaci můžeš smazat. |
| `APP_URL` | doporučeno | veřejná adresa stagingu, např. `https://cv-studio-dev.up.railway.app` |
| `STRIPE_SECRET_KEY` | ne | `sk_test_…`; zapne ceník, platby a vodoznak. Na prezentaci není potřeba (demo odemkne vše), ale ukáže obchodní model. |
| `ACCESS_SECRET` | se Stripe doporučeno | dlouhý náhodný řetězec; podepisuje přístup a kódy. Když ho později změníš, dosavadní přístupy a kódy přestanou platit. |
| `PRICE_14D_CZK`, `PRICE_YEAR_CZK` | ne | celé číslo v Kč (výchozí 99 a 299) |
| `KOFI_URL` | ne | `https://ko-fi.com/<tvuj-profil>`; bez ní se Ko-fi neukáže |
| `PDF_RENDER_SECRET`, `RATE_LIMIT_SECRET` | ne | jako dřív (náhodné řetězce) |
| `ANALYTICS_URL`, `ANALYTICS_ID` | ne | jako dřív |

`CHROMIUM_PATH` na Railway **nenastavuj** (slouží jen pro lokální vývoj a CI).

## Testy

- Vitest: 130+ testů (nově: prezentační cookie, přizpůsobení inzerátu, překlad, přístup, kódy, ceny, Ko-fi odkaz, chaotický text v pojistce).
- Playwright: 200+ průchodů na počítači i mobilu, celé lokálně i v CI zelené. Nově: celý prezentační scénář (chaotický text → životopis → 3 šablony → dopis → PDF), selhání AI a „Zkusit znovu“, přizpůsobení inzerátu, angličtina, platby s tarify, den zdarma, kód na jiném zařízení, serverové hlídání placených funkcí, Ko-fi, axe na všech 8 šablonách.

## Rozhodnutí

Všechna jsou i v `CLAUDE.md` (sekce Rozhodnutí). Nejdůležitější:

- Prezentační režim je **podepsaný cookie**, ne tajná adresa: `?demo=1` bez `DEMO_ENABLED=1` nic neodemkne a cookie nejde podvrhnout.
- Kde AI něco „přizpůsobuje“ nebo překládá, **kód vynucuje** pravidla: přeskupení je jen permutace, firmy a jména se kopírují z češtiny, „máš“ jen s důkazem.
- Ukázka (`Ukázka`) funguje i bez AI, takže je vždy záložní plán.
