import type { Cv } from "./schema";

/**
 * Deterministic "did the AI make this up?" check. Compares facts in the generated CV
 * (companies, schools, degrees, years, numbers, skills, languages, contacts, names and
 * proper nouns) with the user's original text. Runs in code, never via AI, and only
 * flags; it never changes the CV. Tolerant of Czech declension ("v Brně" ~ "Brno").
 */

export type GroundingKind =
  | "name"
  | "contact"
  | "company"
  | "school"
  | "degree"
  | "year"
  | "number"
  | "skill"
  | "language"
  | "term";

export interface GroundingFlag {
  path: string;
  kind: GroundingKind;
  /** The value(s) that were not found in the source text. */
  missing: string[];
}

export const UNVERIFIED_MESSAGE = "Tohle v tvém textu nebylo, zkontroluj";

/** Lowercase, no diacritics. */
export function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Word tokens; keeps "c++", "c#", "node.js", "s.r.o". */
export function tokenize(text: string): string[] {
  return fold(text).match(/[a-z0-9][a-z0-9+#]*(?:\.[a-z0-9]+)*/g) ?? [];
}

/** Tokens that carry no identity in names (prepositions, legal forms, …). */
const STOP = new Set([
  "a", "i", "o", "u", "s", "v", "z", "k", "na", "do", "pro", "za", "od", "ve", "se", "ze", "ke", "the", "of", "and", "at", "in", "for",
  "s.r.o", "sro", "a.s", "as", "spol", "inc", "ltd", "gmbh", "o.p.s", "ops", "z.s", "zs", "k.s", "v.o.s", "se", "plc", "llc", "co",
]);

const CZ_NUMBER_WORDS: Record<string, number> = {};
const NUMBER_FORMS: Array<[number, string[]]> = [
  [1, ["jeden", "jedna", "jedno", "jednoho", "jedne", "jednom", "one"]],
  [2, ["dva", "dve", "dvou", "dvema", "two"]],
  [3, ["tri", "trech", "trem", "tremi", "three"]],
  [4, ["ctyri", "ctyr", "ctyrech", "ctyrmi", "four"]],
  [5, ["pet", "peti", "five"]],
  [6, ["sest", "sesti", "six"]],
  [7, ["sedm", "sedmi", "seven"]],
  [8, ["osm", "osmi", "eight"]],
  [9, ["devet", "deviti", "nine"]],
  [10, ["deset", "deseti", "ten"]],
  [11, ["jedenact", "jedenacti", "eleven"]],
  [12, ["dvanact", "dvanacti", "twelve"]],
  [13, ["trinact", "trinacti"]],
  [14, ["ctrnact", "ctrnacti"]],
  [15, ["patnact", "patnacti", "fifteen"]],
  [20, ["dvacet", "dvaceti", "twenty"]],
  [30, ["tricet", "triceti", "thirty"]],
];
for (const [n, forms] of NUMBER_FORMS) for (const f of forms) CZ_NUMBER_WORDS[f] = n;

/** Language names and the stems that count as mentioning them. */
const LANGUAGES: Array<{ match: string[]; stems: string[] }> = [
  { match: ["cest", "czech"], stems: ["cest", "cesk", "czech"] },
  { match: ["sloven", "slovak"], stems: ["sloven", "slovak"] },
  { match: ["angli", "english"], stems: ["angli", "english", "aj"] },
  { match: ["nemc", "nemec", "german", "deutsch"], stems: ["nemc", "nemec", "nemeck", "german", "deutsch", "nj"] },
  { match: ["franc", "french"], stems: ["franc", "french", "fj"] },
  { match: ["spanel", "spanish"], stems: ["spanel", "spanish", "espan"] },
  { match: ["ital"], stems: ["ital"] },
  { match: ["pols", "polish"], stems: ["pols", "polish"] },
  { match: ["rus", "russian"], stems: ["rus", "russian", "rj"] },
  { match: ["ukrajin", "ukrain"], stems: ["ukrajin", "ukrain"] },
  { match: ["madar", "hungar"], stems: ["madar", "hungar"] },
  { match: ["cin", "chinese"], stems: ["cin", "chinese"] },
  { match: ["japon", "japan"], stems: ["japon", "japan"] },
];

function commonPrefix(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/**
 * Same word, allowing Czech endings: after a shared start of at least 3 letters,
 * each word may only have a short ending (≤ 4 letters) left ("brno"/"brna", "praha"/"praze",
 * "uzivatelsky"/"uzivateli"). So "delam" ≠ "deloitte" and "java" ≠ "javascript".
 * Names use `maxEnding = 2` ("Nová" is not "Nováková").
 */
export function sameWord(a: string, b: string, maxEnding = 4): boolean {
  if (a === b) return true;
  if (/\d/.test(a) || /\d/.test(b)) return false;
  if (Math.min(a.length, b.length) <= 3) return false;
  const p = commonPrefix(a, b);
  return p >= 3 && a.length - p <= maxEnding && b.length - p <= maxEnding;
}

/**
 * Words a careful writer may use for something the user wrote differently
 * (output word stem → source stems that justify it).
 */
const SYNONYMS: Array<[string[], string[]]> = [
  [["ridicsk", "prukaz"], ["ridicak", "ridicsk", "rp"]],
  [["vyucni", "list"], ["vyucen", "vyucil", "vyucni"]],
  [["maturit"], ["maturit", "odmaturov"]],
  [["vysokoskol"], ["vs", "vysok"]],
];

class SourceIndex {
  readonly folded: string;
  readonly tokens: string[];
  readonly digits: string;
  readonly years: Set<string>;
  readonly numbers: Set<string>;

  constructor(source: string) {
    this.folded = fold(source);
    this.tokens = [...new Set(tokenize(source))];
    this.digits = source.replace(/\D/g, "");
    this.years = new Set(this.folded.match(/\b(?:19|20)\d{2}\b/g) ?? []);
    this.numbers = new Set<string>();
    for (const n of numbersIn(this.folded)) this.numbers.add(n);
    for (const t of this.tokens) if (t in CZ_NUMBER_WORDS) this.numbers.add(String(CZ_NUMBER_WORDS[t]));
  }

  hasWord(word: string, maxEnding?: number): boolean {
    if (this.tokens.some((t) => sameWord(word, t, maxEnding))) return true;
    for (const [outputStems, sourceStems] of SYNONYMS) {
      if (outputStems.some((o) => word.startsWith(o)) && sourceStems.some((st) => this.hasStem(st))) return true;
    }
    return false;
  }

  hasStem(stem: string): boolean {
    return this.tokens.some((t) => t.startsWith(stem));
  }
}

/** Numbers that are not part of a word (so "C1" or "B2B" do not count). */
function numbersIn(folded: string): string[] {
  return (folded.match(/(?<![a-z0-9])\d+(?:[.,]\d+)?(?![a-z])/g) ?? []).map((n) => n.replace(",", "."));
}

function significant(text: string): string[] {
  return tokenize(text).filter((t) => !STOP.has(t) && !/^\d+$/.test(t));
}

/** Words of `value` that the source does not contain. */
function missingWords(value: string, src: SourceIndex, maxEnding?: number): string[] {
  return significant(value).filter((t) => !src.hasWord(t, maxEnding));
}

function checkYears(value: string, src: SourceIndex): string[] {
  return (fold(value).match(/\b(?:19|20)\d{2}\b/g) ?? []).filter((y) => !src.years.has(y));
}

function checkNumbers(value: string, src: SourceIndex): string[] {
  return numbersIn(fold(value)).filter((n) => !/^(?:19|20)\d{2}$/.test(n) && !src.numbers.has(n));
}

/** Capitalised or acronym words inside a sentence (tool and company names). */
function checkTerms(value: string, src: SourceIndex): string[] {
  const missing: string[] = [];
  const re = /(^|[.!?…]\s+|\s|[(„"/])([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][\p{L}0-9+#.]*)/gu;
  for (const m of value.matchAll(re)) {
    // Look at the text itself: the previous capitalised word may have eaten the full stop.
    const before = value.slice(0, m.index + m[1].length).trimEnd();
    const sentenceStart = before === "" || /[.!?…]$/.test(before);
    const word = m[2].replace(/[.]+$/, "");
    const isAcronym = /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9+#]{2,}$/.test(word);
    if (sentenceStart && !isAcronym) continue;
    for (const t of tokenize(word)) {
      if (!STOP.has(t) && !src.hasWord(t)) missing.push(word);
    }
  }
  return [...new Set(missing)];
}

function checkLanguage(language: string, src: SourceIndex): string[] {
  const l = fold(language);
  const known = LANGUAGES.find((entry) => entry.match.some((m) => l.startsWith(m)));
  if (known) return known.stems.some((s) => src.hasStem(s)) ? [] : [language];
  return missingWords(language, src).length ? [language] : [];
}

function checkLevel(level: string, src: SourceIndex): string[] {
  if (!level) return [];
  const cefr = fold(level).match(/\b[abc][12]\b/g);
  if (cefr) return cefr.filter((c) => !src.tokens.includes(c)).map((c) => c.toUpperCase());
  return missingWords(level, src).length ? [level] : [];
}

function checkContact(kind: "email" | "phone" | "location" | "web", value: string, src: SourceIndex): string[] {
  if (!value) return [];
  if (kind === "email") return src.folded.includes(fold(value)) ? [] : [value];
  if (kind === "phone") {
    const digits = value.replace(/\D/g, "");
    const core = digits.slice(-9);
    return core.length >= 6 && src.digits.includes(core) ? [] : [value];
  }
  if (kind === "web") {
    const bare = fold(value).replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
    return src.folded.includes(bare) ? [] : [value];
  }
  return missingWords(value, src).length ? [value] : [];
}

/**
 * Years, numbers and proper nouns in free text (e.g. a cover letter paragraph) that
 * the source does not contain.
 */
export function checkFreeText(text: string, source: string): string[] {
  const src = new SourceIndex(source);
  return [...new Set([...checkYears(text, src), ...checkNumbers(text, src), ...checkTerms(text, src)])];
}

/** Only years and numbers (for translations, where words legitimately change). */
export function checkNumbersAndYears(text: string, source: string): string[] {
  const src = new SourceIndex(source);
  return [...new Set([...checkYears(text, src), ...checkNumbers(text, src)])];
}

/** All facts in the CV that the source text does not support. */
export function checkGrounding(cv: Cv, source: string): GroundingFlag[] {
  const src = new SourceIndex(source);
  const flags: GroundingFlag[] = [];
  const add = (path: string, kind: GroundingKind, missing: string[]) => {
    if (missing.length) flags.push({ path, kind, missing: [...new Set(missing)] });
  };

  // Names: only small ending changes allowed ("Nová" is not "Nováková").
  add("name", "name", missingWords(cv.name, src, 2));
  for (const key of ["email", "phone", "location", "web"] as const) {
    add(`contact.${key}`, "contact", checkContact(key, cv.contact[key], src));
  }
  add("headline", "term", [...checkTerms(cv.headline, src), ...checkNumbers(cv.headline, src)]);
  add("summary", "number", [...checkYears(cv.summary, src), ...checkNumbers(cv.summary, src), ...checkTerms(cv.summary, src)]);

  cv.experience.forEach((e, i) => {
    add(`experience.${i}.company`, "company", missingWords(e.company, src).length ? [e.company] : []);
    add(`experience.${i}.period`, "year", checkYears(e.period, src));
    e.highlights.forEach((h, j) => {
      add(`experience.${i}.highlights.${j}`, "number", [
        ...checkYears(h, src),
        ...checkNumbers(h, src),
        ...checkTerms(h, src),
      ]);
    });
  });

  cv.education.forEach((e, i) => {
    add(`education.${i}.school`, "school", missingWords(e.school, src).length ? [e.school] : []);
    add(`education.${i}.degree`, "degree", missingWords(e.degree.replace(/\b(?:Bc|Mgr|Ing|PhDr|MUDr|JUDr|RNDr|Ph\.D|MBA|BA|MA|MSc|BSc)\.?/g, ""), src));
    add(`education.${i}.period`, "year", checkYears(e.period, src));
  });

  cv.skills.forEach((skill, i) => add(`skills.${i}`, "skill", missingWords(skill, src).length ? [skill] : []));

  cv.languages.forEach((l, i) => {
    add(`languages.${i}.language`, "language", checkLanguage(l.language, src));
    add(`languages.${i}.level`, "language", checkLevel(l.level, src));
  });

  return flags;
}
