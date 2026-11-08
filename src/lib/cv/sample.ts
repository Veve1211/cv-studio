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
    "Produktová designérka se šesti lety praxe v mobilních a webových aplikacích. Propojuje výzkum s uživateli, rychlé prototypy a úzkou spolupráci s vývojáři.",
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
    "Backend vývojář s jedenácti lety praxe v e-commerce a fintechu. Posledních pět let vede menší týmy, stará se o architekturu služeb a o to, aby se nasazovalo často a bez stresu. Rád učí mladší kolegy a píše dokumentaci, kterou lidé opravdu čtou.",
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
