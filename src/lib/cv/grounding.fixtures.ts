import { EXAMPLES } from "./examples";
import type { Cv } from "./schema";

/**
 * Ten realistic inputs (all fictional people) with a CV that a faithful model could
 * produce from them. Used to check that the grounding check does not cry wolf on
 * honest output and does catch planted inventions.
 */
export interface GroundingFixture {
  name: string;
  input: string;
  faithful: Cv;
}

const contact = (c: Partial<Cv["contact"]> = {}): Cv["contact"] => ({ email: "", phone: "", location: "", web: "", ...c });

export const GROUNDING_FIXTURES: GroundingFixture[] = [
  {
    name: "krátký",
    input: "Petr Malý, Plzeň. Řidič rozvozu u firmy Rohlík 3 roky. Mám řidičák B a C.",
    faithful: {
      name: "Petr Malý",
      headline: "Řidič rozvozu",
      contact: contact({ location: "Plzeň" }),
      summary: "Řidič rozvozu se třemi lety praxe.",
      experience: [{ company: "Rohlík", role: "Řidič rozvozu", period: "", highlights: ["Rozvoz zboží zákazníkům"] }],
      education: [],
      skills: ["Řidičský průkaz B", "Řidičský průkaz C"],
      languages: [],
    },
  },
  {
    name: "chaotický",
    input:
      "no tak ja jsem jana, bydlim v ostrave. delala jsem 4 roky v uctarne u Ocel a.s. (2019-2023), predtim 2 roky recepce hotel Imperial. umim excel, pohodu, anglictina B2. obchodni akademie ostrava maturita 2015. jana.k@example.com",
    faithful: {
      name: "Jana",
      headline: "Účetní",
      contact: contact({ email: "jana.k@example.com", location: "Ostrava" }),
      summary: "Účetní se čtyřmi lety praxe a zkušenostmi z recepce hotelu.",
      experience: [
        { company: "Ocel a.s.", role: "Účetní", period: "2019 – 2023", highlights: ["Vedení účetnictví v programu Pohoda"] },
        { company: "Hotel Imperial", role: "Recepční", period: "", highlights: ["Péče o hosty na recepci"] },
      ],
      education: [{ school: "Obchodní akademie Ostrava", degree: "Maturita", period: "2015" }],
      skills: ["Excel", "Pohoda"],
      languages: [{ language: "Angličtina", level: "B2" }],
    },
  },
  {
    name: "odrážky",
    input: `- Tomáš Novotný
- +420 602 111 222
- 2020–dosud: Alza.cz, skladník, později vedoucí směny (tým 12 lidí)
- 2017–2020: Lidl, pokladní
- SOU Brno, vyučen 2017
- VZV průkaz, SAP`,
    faithful: {
      name: "Tomáš Novotný",
      headline: "Vedoucí směny ve skladu",
      contact: contact({ phone: "+420 602 111 222" }),
      summary: "Vedoucí směny ve skladu, vede tým 12 lidí.",
      experience: [
        { company: "Alza.cz", role: "Vedoucí směny", period: "2020 – dosud", highlights: ["Vede tým 12 lidí", "Začínal jako skladník"] },
        { company: "Lidl", role: "Pokladní", period: "2017 – 2020", highlights: [] },
      ],
      education: [{ school: "SOU Brno", degree: "Výuční list", period: "2017" }],
      skills: ["VZV průkaz", "SAP"],
      languages: [],
    },
  },
  {
    name: "LinkedIn",
    input: `Lucie Horáková
Marketing Manager at Kofola ČeskoSlovensko
Praha, Česko
Zkušenosti
Marketing Manager · Kofola ČeskoSlovensko · led 2021 – současnost
Vedení kampaní pro značku Rajec, rozpočet 15 mil. Kč.
Brand Specialist · Unilever · 2018 – 2021
Vzdělání
Vysoká škola ekonomická v Praze · Ing., Marketing · 2013 – 2018
Dovednosti: Brand management, Google Analytics, Meta Ads
Jazyky: angličtina (C1), němčina (B1)`,
    faithful: {
      name: "Lucie Horáková",
      headline: "Marketing Manager",
      contact: contact({ location: "Praha" }),
      summary: "Marketingová manažerka s praxí ve značkách Kofola a Unilever.",
      experience: [
        {
          company: "Kofola ČeskoSlovensko",
          role: "Marketing Manager",
          period: "2021 – dosud",
          highlights: ["Vede kampaně pro značku Rajec s rozpočtem 15 mil. Kč"],
        },
        { company: "Unilever", role: "Brand Specialist", period: "2018 – 2021", highlights: [] },
      ],
      education: [{ school: "Vysoká škola ekonomická v Praze", degree: "Ing., Marketing", period: "2013 – 2018" }],
      skills: ["Brand management", "Google Analytics", "Meta Ads"],
      languages: [
        { language: "Angličtina", level: "C1" },
        { language: "Němčina", level: "B1" },
      ],
    },
  },
  {
    name: "angličtina",
    input:
      "Hi, I'm David Smith from Prague. Software engineer, 5 years at Avast (2019-2024) building backend services in Go and Python. Before that 2 years at Seznam.cz. MSc Computer Science, Charles University 2019. Czech B1, English native. david@example.com",
    faithful: {
      name: "David Smith",
      headline: "Softwarový inženýr",
      contact: contact({ email: "david@example.com", location: "Praha" }),
      summary: "Softwarový inženýr s pěti lety praxe v Avastu, zaměřený na backend v Go a Pythonu.",
      experience: [
        { company: "Avast", role: "Software Engineer", period: "2019 – 2024", highlights: ["Vývoj backendových služeb v Go a Pythonu"] },
        { company: "Seznam.cz", role: "Software Engineer", period: "", highlights: [] },
      ],
      education: [{ school: "Charles University", degree: "MSc, Computer Science", period: "2019" }],
      skills: ["Go", "Python", "Backend"],
      languages: [
        { language: "Angličtina", level: "native" },
        { language: "Čeština", level: "B1" },
      ],
    },
  },
  {
    name: "s překlepy",
    input:
      "Jmenuju se Eva Dvořáková, pracuju jako zdravotni sestra v Nemocnice Na Bulovce od roku 2016. predtim 3 roky v LDN Pečky. stredni zdravotnicka skola Kolin 2013. umim praci s pacientem, odber krve, nemcina A2",
    faithful: {
      name: "Eva Dvořáková",
      headline: "Zdravotní sestra",
      contact: contact(),
      summary: "Zdravotní sestra s praxí v nemocnici i LDN.",
      experience: [
        { company: "Nemocnice Na Bulovce", role: "Zdravotní sestra", period: "2016 – dosud", highlights: ["Péče o pacienty a odběry krve"] },
        { company: "LDN Pečky", role: "Zdravotní sestra", period: "", highlights: [] },
      ],
      education: [{ school: "Střední zdravotnická škola Kolín", degree: "", period: "2013" }],
      skills: ["Práce s pacientem", "Odběr krve"],
      languages: [{ language: "Němčina", level: "A2" }],
    },
  },
  {
    name: "absolventka",
    input:
      EXAMPLES.find((e) => e.id === "graduate")!.text,
    faithful: {
      name: "Klára Veselá",
      headline: "Absolventka psychologie",
      contact: contact({ email: "klara.vesela@example.com", location: "Brno" }),
      summary: "Čerstvá absolventka psychologie se stáží v neziskovém sektoru.",
      experience: [
        { company: "Nadace Terezy Maxové", role: "Stážistka", period: "2023", highlights: [] },
        { company: "Linka bezpečí", role: "Dobrovolnice", period: "", highlights: [] },
      ],
      education: [{ school: "Masarykova univerzita", degree: "Bc., Psychologie", period: "2021 – 2024" }],
      skills: ["SPSS"],
      languages: [{ language: "Angličtina", level: "C1" }],
    },
  },
  {
    name: "návrat po rodičovské",
    input:
      EXAMPLES.find((e) => e.id === "parental")!.text,
    faithful: {
      name: "Martina Šťastná",
      headline: "Asistentka ředitele",
      contact: contact({ location: "Liberec" }),
      summary: "Asistentka ředitele se šesti lety praxe, po rodičovské dovolené připravená k návratu.",
      experience: [
        {
          company: "Preciosa a.s.",
          role: "Asistentka ředitele",
          period: "2014 – 2020",
          highlights: ["Správa diáře a cest", "Organizace porad"],
        },
      ],
      education: [{ school: "Gymnázium Liberec", degree: "", period: "2009" }],
      skills: ["Word", "Excel", "Outlook", "Řidičský průkaz B"],
      languages: [{ language: "Angličtina", level: "B2" }],
    },
  },
  {
    name: "změna oboru",
    input:
      EXAMPLES.find((e) => e.id === "career-change")!.text,
    faithful: {
      name: "Ondřej Kučera",
      headline: "Datový analytik",
      contact: contact({ email: "ondrej@example.com", web: "github.com/ondrejk-example" }),
      summary: "Bývalý učitel matematiky s osmi lety praxe, který přechází do datové analytiky.",
      experience: [
        {
          company: "ZŠ Hálkova Olomouc",
          role: "Učitel matematiky",
          period: "2015 – 2023",
          highlights: ["Výuka matematiky na základní škole"],
        },
      ],
      education: [{ school: "Czechitas", degree: "Data Academy", period: "2024" }],
      skills: ["SQL", "Python", "Power BI"],
      languages: [],
    },
  },
  {
    name: "dlouhý senior",
    input: `Jan Dvořák, Praha, jan.dvorak@example.com, +420 603 000 111
2021–dosud Platby a.s. – vedoucí backend týmu (6 lidí), rozdělení monolitu na služby, nasazení zkrácené ze 2 hodin na 10 minut
2018–2021 Obchod.example – senior backend vývojář, Kafka, PostgreSQL
2016–2018 Fintech Labs – backend vývojář v Go
ČVUT FIT, Ing. softwarové inženýrství 2011–2016
angličtina C1, španělština B1
Kubernetes, AWS, Terraform, mentoring`,
    faithful: {
      name: "Jan Dvořák",
      headline: "Vedoucí backend týmu",
      contact: contact({ email: "jan.dvorak@example.com", phone: "+420 603 000 111", location: "Praha" }),
      summary: "Backendový vývojář a vedoucí týmu se zkušenostmi z fintechu a e-commerce.",
      experience: [
        {
          company: "Platby a.s.",
          role: "Vedoucí backend týmu",
          period: "2021 – dosud",
          highlights: ["Vede tým 6 lidí", "Rozdělil monolit na služby", "Zkrátil nasazení ze 2 hodin na 10 minut"],
        },
        { company: "Obchod.example", role: "Senior backend vývojář", period: "2018 – 2021", highlights: ["Práce s Kafkou a PostgreSQL"] },
        { company: "Fintech Labs", role: "Backend vývojář", period: "2016 – 2018", highlights: ["Vývoj v Go"] },
      ],
      education: [{ school: "ČVUT FIT", degree: "Ing., Softwarové inženýrství", period: "2011 – 2016" }],
      skills: ["Kubernetes", "AWS", "Terraform", "Mentoring", "Kafka", "PostgreSQL", "Go"],
      languages: [
        { language: "Angličtina", level: "C1" },
        { language: "Španělština", level: "B1" },
      ],
    },
  },
];
