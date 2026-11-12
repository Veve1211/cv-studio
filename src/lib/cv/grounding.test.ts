import { describe, expect, it, vi } from "vitest";
import { generateCv, type MessagesClient } from "./generate";
import { checkGrounding, sameWord } from "./grounding";
import { GROUNDING_FIXTURES } from "./grounding.fixtures";
import { CvSchema, type Cv } from "./schema";

const paths = (cv: Cv, source: string) => checkGrounding(cv, source).map((f) => f.path);

describe("sameWord (Czech declension)", () => {
  it("matches declined forms", () => {
    expect(sameWord("brno", "brna")).toBe(true);
    expect(sameWord("praha", "praze")).toBe(true);
    expect(sameWord("uzivatelsky", "uzivateli")).toBe(true);
    expect(sameWord("excel", "excelu")).toBe(true);
  });
  it("does not match different words", () => {
    expect(sameWord("sql", "sas")).toBe(false);
    expect(sameWord("google", "gorila")).toBe(false);
    expect(sameWord("2019", "2018")).toBe(false);
    expect(sameWord("delam", "deloitte")).toBe(false);
    expect(sameWord("java", "javascript")).toBe(false);
    expect(sameWord("nova", "novakova", 2)).toBe(false);
  });
});

describe("sentence starts", () => {
  it("does not flag a capitalised word after a sentence that ended with a name", () => {
    const cv = { ...GROUNDING_FIXTURES[0].faithful, summary: "Spravuje Instagram. Chce se posunout dál." };
    expect(paths(cv, "delam Instagram kavarny")).not.toContain("summary");
  });
});

describe("grounding fixtures", () => {
  it("has 11 valid fixtures", () => {
    expect(GROUNDING_FIXTURES).toHaveLength(11);
    for (const f of GROUNDING_FIXTURES) expect(CvSchema.safeParse(f.faithful).success, f.name).toBe(true);
  });

  for (const f of GROUNDING_FIXTURES) {
    describe(f.name, () => {
      it("does not flag a faithful CV", () => {
        expect(checkGrounding(f.faithful, f.input)).toEqual([]);
      });

      it("flags an invented company, year, number, skill, school and language", () => {
        const cv: Cv = structuredClone(f.faithful);
        cv.experience.unshift({
          company: "Deloitte",
          role: "Konzultant",
          period: "1999 – 2001",
          highlights: ["Zvýšil tržby o 47 %", "Zavedl Salesforce"],
        });
        cv.skills.push("Kubernetes Operator Framework");
        cv.education.push({ school: "Harvard University", degree: "MBA, Finance", period: "1998" });
        cv.languages.push({ language: "Japonština", level: "C2" });

        const flagged = paths(cv, f.input);
        expect(flagged).toContain("experience.0.company");
        expect(flagged).toContain("experience.0.period");
        expect(flagged).toContain("experience.0.highlights.0");
        expect(flagged).toContain("experience.0.highlights.1");
        expect(flagged).toContain(`skills.${cv.skills.length - 1}`);
        expect(flagged).toContain(`education.${cv.education.length - 1}.school`);
        expect(flagged).toContain(`languages.${cv.languages.length - 1}.language`);
        expect(flagged).toContain(`languages.${cv.languages.length - 1}.level`);
        // the faithful part stays clean (indexes shift by one because of unshift)
        expect(flagged.filter((p) => p.startsWith("experience.1"))).toEqual([]);
      });
    });
  }
});

describe("specific checks", () => {
  const source = "Pavla Nová, Brno, pavla@example.com, 777 123 456. Účetní v Pekárna Kroupa 2018–2022.";
  const base: Cv = {
    name: "Pavla Nová",
    headline: "Účetní",
    contact: { email: "pavla@example.com", phone: "+420 777 123 456", location: "Brno", web: "" },
    summary: "",
    experience: [{ company: "Pekárna Kroupa", role: "Účetní", period: "2018 – 2022", highlights: [] }],
    education: [],
    skills: [],
    languages: [],
  };

  it("accepts reformatted contacts", () => {
    expect(paths(base, source)).toEqual([]);
  });

  it("flags changed contacts and names", () => {
    const cv = structuredClone(base);
    cv.contact.email = "pavla.nova@example.com";
    cv.contact.phone = "+420 777 999 000";
    cv.contact.web = "linkedin.com/in/pavla";
    cv.name = "Pavla Nováková";
    expect(paths(cv, source)).toEqual(["name", "contact.email", "contact.phone", "contact.web"]);
  });

  it("understands numbers written as Czech words", () => {
    const cv = { ...structuredClone(base), summary: "Účetní se 4 lety praxe." };
    expect(paths(cv, "Pavla Nová, Brno, pavla@example.com, 777 123 456. Čtyři roky účetní v Pekárna Kroupa 2018–2022.")).toEqual([]);
  });

  it("flags capitalised tool names that were never mentioned", () => {
    const cv = structuredClone(base);
    cv.experience[0].highlights = ["Vedla účetnictví v systému Helios", "Zpracovávala mzdy"];
    expect(paths(cv, source)).toEqual(["experience.0.highlights.0"]);
  });

  it("works on the output of the (mocked) AI pipeline", async () => {
    const invented = { ...structuredClone(base), skills: ["Účetnictví", "SAP"] };
    const create = vi.fn().mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(invented) }] });
    const client = { beta: { messages: { create } } } as MessagesClient;
    const cv = await generateCv(source, client);
    expect(paths(cv, source)).toEqual(["skills.1"]);
  });
});

describe("checkFreeText (cover letters)", () => {
  it("flags numbers and names that are in neither the CV nor the job ad", async () => {
    const { checkFreeText } = await import("./grounding");
    const source = "Účetní v Ocel a.s. 2019–2023, Pohoda, Excel. Inzerát: Hledáme účetní do firmy Kovo Brno.";
    expect(checkFreeText("Čtyři roky jsem v Ocel a.s. vedla účetnictví v Pohodě a ráda bych pracovala pro Kovo.", source)).toEqual([]);
    expect(checkFreeText("Ušetřila jsem firmě 30 % nákladů v systému Helios.", source)).toEqual(["30", "Helios"]);
  });
});
