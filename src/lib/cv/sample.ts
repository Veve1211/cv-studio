import type { Cv } from "./schema";

/**
 * Fictional people used for the demo button, mocked AI responses in tests
 * and template previews. Never real data.
 */
export const SAMPLE_CV: Cv = {
  name: "Tereza Nováková",
  headline: "Produktová designérka",
  contact: {
    email: "tereza.novakova@example.com",
    phone: "+420 777 123 456",
    location: "Brno",
    web: "terezanovakova.example",
  },
  summary:
    "Produktová designérka s devíti lety praxe v mobilních a webových aplikacích. Propojuje výzkum s uživateli, rychlé prototypy a úzkou spolupráci s vývojáři.",
  experience: [
    {
      company: "Kvetoucí s.r.o.",
      role: "Senior produktová designérka",
      period: "2022 – dosud",
      highlights: [
        "Vede design mobilní aplikace pro objednávky květin",
        "Zavedla pravidelné testování s uživateli každé dva týdny",
        "Vybudovala sdílenou knihovnu komponent pro tři týmy",
      ],
    },
    {
      company: "Agentura Pixel",
      role: "UX/UI designérka",
      period: "2019 – 2022",
      highlights: [
        "Navrhovala weby a e-shopy pro klienty z retailu",
        "Připravovala interaktivní prototypy ve Figmě",
      ],
    },
    {
      company: "Tiskárna Brno",
      role: "Grafička",
      period: "2017 – 2019",
      highlights: ["Sazba katalogů a letáků", "Příprava podkladů pro tisk"],
    },
  ],
  education: [{ school: "Masarykova univerzita", degree: "Mgr., Vizuální komunikace", period: "2012 – 2017" }],
  skills: ["Figma", "Uživatelský výzkum", "Prototypování", "Design systémy", "HTML a CSS", "Workshopy"],
  languages: [
    { language: "Čeština", level: "rodilá mluvčí" },
    { language: "Angličtina", level: "C1" },
    { language: "Němčina", level: "A2" },
  ],
};

/** A long CV used to test that templates and PDF export handle overflow. */
export const LONG_SAMPLE_CV: Cv = {
  name: "Jan Dvořák",
  headline: "Backend vývojář a vedoucí týmu",
  contact: {
    email: "jan.dvorak@example.com",
    phone: "+420 603 000 111",
    location: "Praha",
    web: "github.com/jandvorak-example",
  },
  summary:
    "Backend vývojář se třinácti lety praxe v e-commerce a fintechu. Posledních pět let vede menší týmy, stará se o architekturu služeb a o to, aby se nasazovalo často a bez stresu. Rád učí mladší kolegy a píše dokumentaci, kterou lidé opravdu čtou.",
  experience: Array.from({ length: 6 }, (_, i) => ({
    company: ["Platby a.s.", "Obchod.example", "Fintech Labs", "Logistika CZ", "Studio Kód", "Univerzitní IT"][i],
    role: ["Vedoucí backend týmu", "Senior backend vývojář", "Backend vývojář", "Vývojář", "Junior vývojář", "Stážista"][i],
    period: ["2021 – dosud", "2018 – 2021", "2016 – 2018", "2015 – 2016", "2014 – 2015", "2013 – 2014"][i],
    highlights: [
      "Navrhl a zavedl rozdělení monolitu na menší služby",
      "Zkrátil dobu nasazení z hodin na minuty díky automatizaci",
      "Mentoroval čtyři juniorní vývojáře",
      "Spolupracoval s produktem na plánování čtvrtletních cílů",
    ].slice(0, 4 - (i % 3)),
  })),
  education: [
    { school: "ČVUT FIT", degree: "Ing., Softwarové inženýrství", period: "2011 – 2016" },
    { school: "Gymnázium Jana Nerudy", degree: "Maturita", period: "2003 – 2011" },
  ],
  skills: ["Go", "TypeScript", "PostgreSQL", "Kafka", "Kubernetes", "AWS", "Terraform", "CI/CD", "Code review", "Mentoring", "Architektura", "Observabilita"],
  languages: [
    { language: "Čeština", level: "rodilý mluvčí" },
    { language: "Angličtina", level: "C1" },
    { language: "Španělština", level: "B1" },
  ],
};

/**
 * Other fictional people for the landing showcase and the template picker,
 * so the sample person (Tereza) appears only once on the page – in "Před a po".
 */
export const SHOWCASE_CVS: readonly [Cv, Cv, Cv] = [
  {
    name: "Lucie Horáková",
    headline: "Účetní",
    contact: { email: "lucie.horakova@example.com", phone: "+420 604 222 333", location: "Ostrava", web: "" },
    summary:
      "Účetní s deseti lety praxe ve výrobní firmě. Zpracovává mzdy, DPH i roční závěrky a ráda zjednodušuje firemní procesy.",
    experience: [
      {
        company: "Ocel Ostrava a.s.",
        role: "Samostatná účetní",
        period: "2019 – dosud",
        highlights: ["Vede účetnictví dvou dceřiných společností", "Připravuje měsíční a roční závěrky"],
      },
      {
        company: "Hotel Morava",
        role: "Recepční a fakturantka",
        period: "2016 – 2019",
        highlights: ["Fakturace firemních klientů", "Komunikace s hosty v angličtině"],
      },
    ],
    education: [{ school: "Obchodní akademie Ostrava", degree: "Maturita, Ekonomické lyceum", period: "2012 – 2016" }],
    skills: ["Pohoda", "Excel", "Mzdy", "DPH", "Závěrky"],
    languages: [
      { language: "Čeština", level: "rodilá mluvčí" },
      { language: "Angličtina", level: "B2" },
    ],
  },
  {
    name: "Martin Svoboda",
    headline: "Servisní technik",
    contact: { email: "martin.svoboda@example.com", phone: "+420 731 444 555", location: "Plzeň", web: "" },
    summary:
      "Servisní technik s dvanácti lety praxe v údržbě výrobních linek. Spolehlivý, zvyklý na směnný provoz a práci v týmu.",
    experience: [
      {
        company: "Strojírny Plzeň s.r.o.",
        role: "Servisní technik",
        period: "2018 – dosud",
        highlights: ["Údržba a opravy balicích linek", "Zaškolil pět nových kolegů"],
      },
      {
        company: "Autoservis Kovář",
        role: "Automechanik",
        period: "2014 – 2018",
        highlights: ["Diagnostika a opravy osobních vozů"],
      },
    ],
    education: [{ school: "SOU strojírenské Plzeň", degree: "Výuční list, Mechanik opravář", period: "2011 – 2014" }],
    skills: ["Elektro vyhláška 50", "Pneumatika", "Hydraulika", "Řidičák sk. B"],
    languages: [
      { language: "Čeština", level: "rodilý mluvčí" },
      { language: "Němčina", level: "B1" },
    ],
  },
  {
    name: "Eliška Marková",
    headline: "Marketingová specialistka",
    contact: { email: "eliska.markova@example.com", phone: "+420 702 666 777", location: "Praha", web: "" },
    summary:
      "Marketingová specialistka zaměřená na sociální sítě a e-mailové kampaně. Plánuje obsah podle dat a ráda testuje nové nápady.",
    experience: [
      {
        company: "Kavárny Zrnko",
        role: "Marketingová specialistka",
        period: "2021 – dosud",
        highlights: ["Spravuje sociální sítě pro 12 poboček", "Spustila věrnostní newsletter"],
      },
      {
        company: "Agentura Lano",
        role: "Junior copywriterka",
        period: "2019 – 2021",
        highlights: ["Texty pro weby a kampaně klientů"],
      },
    ],
    education: [{ school: "Univerzita Karlova", degree: "Bc., Mediální studia", period: "2016 – 2019" }],
    skills: ["Meta Ads", "Copywriting", "Mailchimp", "Canva", "Google Analytics"],
    languages: [
      { language: "Čeština", level: "rodilá mluvčí" },
      { language: "Angličtina", level: "C1" },
    ],
  },
];
