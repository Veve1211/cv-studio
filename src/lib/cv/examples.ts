import type { Cv } from "./schema";

/** Messy on purpose: the presentation example where the difference stands out. */
const CHAOS_TEXT = `ahoj, tak ja jsem petra dvorakova z brna. posledni 3 roky (2022-dosud) delam v kavarne Spolek jako vedouci smeny, mam pod sebou 6 lidi, delam objednavky a rozpisy smen.. jo a delam jim instagram, za rok z 800 na 5000 sledujicich!!
predtim 2019-2022 prodavacka v DM drogerie, mela jsem na starost regal s kosmetikou + inventury
skola - SOŠ obchodní Brno, maturita 2019
umim excel (zaklady), canva, pokladna Dotykačka. anglicky B1, nemecky A2. ridicak B
chtela bych neco v marketingu / socialni site
petra.dvorakova@example.com`;

/** Clickable starting points under the text field (fictional people). */
export const EXAMPLES = [
  {
    id: "chaos",
    label: "Chaotický text",
    text: CHAOS_TEXT,
  },
  {
    id: "graduate",
    label: "Absolventka",
    text: "Klára Veselá, čerstvá absolventka Bc. Psychologie na Masarykově univerzitě (2021–2024). Stáž v Nadaci Terezy Maxové 2023, dobrovolnice v Linka bezpečí. Umím SPSS, angličtina C1. klara.vesela@example.com, Brno",
  },
  {
    id: "parental",
    label: "Návrat po rodičovské",
    text: "Martina Šťastná, Liberec. 2014–2020 asistentka ředitele ve Preciosa a.s. (diář, cesty, porady), pak rodičovská 2020–2024. Teď chci zpátky. Word, Excel, Outlook, angličtina B2, řidičák B. Gymnázium Liberec 2009.",
  },
  {
    id: "career-change",
    label: "Změna oboru",
    text: "Ondřej Kučera. 8 let jsem učil matematiku na ZŠ Hálkova Olomouc (2015–2023). Pak jsem dal kurz Czechitas Data Academy 2024 a dělám si projekty v SQL, Python a Power BI. Chci dělat datového analytika. ondrej@example.com, github.com/ondrejk-example",
  },
] as const;

/**
 * What a faithful model makes of the messy example. Used by the grounding tests and as
 * the offline (E2E_MOCK_AI) answer, so the demo flow can be tested end to end.
 */
export const CHAOS_CV: Cv = {
  name: "Petra Dvořáková",
  headline: "Vedoucí směny se zkušeností se sociálními sítěmi",
  contact: { email: "petra.dvorakova@example.com", phone: "", location: "Brno", web: "" },
  summary:
    "Vedoucí směny v kavárně, která vede tým 6 lidí a spravuje firemní Instagram. Chce se posunout do marketingu a sociálních sítí.",
  experience: [
    {
      company: "Kavárna Spolek",
      role: "Vedoucí směny",
      period: "2022 – dosud",
      highlights: [
        "Vede tým 6 lidí",
        "Zajišťuje objednávky a rozpisy směn",
        "Spravuje Instagram kavárny: za rok růst z 800 na 5000 sledujících",
      ],
    },
    {
      company: "DM drogerie",
      role: "Prodavačka",
      period: "2019 – 2022",
      highlights: ["Starala se o regál s kosmetikou", "Podílela se na inventurách"],
    },
  ],
  education: [{ school: "SOŠ obchodní Brno", degree: "Maturita", period: "2019" }],
  skills: ["Excel (základy)", "Canva", "Dotykačka", "Řidičský průkaz B"],
  languages: [
    { language: "Angličtina", level: "B1" },
    { language: "Němčina", level: "A2" },
  ],
};
