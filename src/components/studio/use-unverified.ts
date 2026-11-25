"use client";

import { useMemo } from "react";
import { checkFreeText, checkGrounding, checkNumbersAndYears } from "@/lib/cv/grounding";
import type { Cv } from "@/lib/cv/schema";
import type { LetterDoc } from "@/lib/letter/schema";
import { checkTranslation } from "@/lib/translate/translate";
import type { useEnglish } from "./use-english";
import type { useLetter } from "./use-letter";

type Unverified = Map<string, string[]>;

/**
 * Facts the AI wrote that are not backed by the user's text – a code check, never
 * the AI (src/lib/cv/grounding.ts). One map per document shown: the CV, the cover
 * letter and their English versions. Fields the user confirmed are left out.
 */
export function useUnverified({
  cv,
  source,
  confirmed,
  letter,
  english,
}: {
  cv: Cv | null;
  source: string | null;
  confirmed: ReadonlySet<string>;
  letter: Pick<ReturnType<typeof useLetter>, "letter" | "job" | "confirmed">;
  english: Pick<ReturnType<typeof useEnglish>, "state" | "confirmed">;
}) {
  const unverified = useMemo(() => {
    const map: Unverified = new Map();
    if (!cv || source === null) return map;
    for (const flag of checkGrounding(cv, source)) {
      if (!confirmed.has(flag.path)) map.set(flag.path, flag.missing);
    }
    return map;
  }, [cv, source, confirmed]);

  // Cover letter: numbers, years and names must come from the CV, the user's text or the job ad.
  const letterUnverified = useMemo(
    () => letterCheck(cv, source, letter.letter, letter.job, letter.confirmed),
    [cv, source, letter.letter, letter.job, letter.confirmed],
  );

  // Translation: numbers and years must match the Czech version (names and
  // companies are copied over in code, never translated).
  const en = english.state;
  const enUnverified = useMemo(() => {
    const map: Unverified = new Map();
    if (!en) return map;
    for (const [path, missing] of checkTranslation(en.cv, en.fromCv)) {
      if (!english.confirmed.has(path)) map.set(path, missing);
    }
    return map;
  }, [en, english.confirmed]);
  const enLetterUnverified = useMemo(() => {
    const map: Unverified = new Map();
    if (!en?.letter) return map;
    const known = JSON.stringify([en.fromCv, en.fromLetter]);
    en.letter.paragraphs.forEach((p, i) => {
      const missing = checkNumbersAndYears(p, known);
      if (missing.length && !english.confirmed.has(`letter:paragraphs.${i}`)) map.set(`paragraphs.${i}`, missing);
    });
    return map;
  }, [en, english.confirmed]);

  return { unverified, letterUnverified, enUnverified, enLetterUnverified };
}

function letterCheck(
  cv: Cv | null,
  source: string | null,
  letter: LetterDoc | null,
  job: string,
  confirmed: ReadonlySet<string>,
): Unverified {
  const map: Unverified = new Map();
  if (!cv || !letter) return map;
  const known = [source ?? "", job, JSON.stringify(cv)].join("\n");
  const fields: Array<[string, string]> = [
    ["recipient", letter.recipient],
    ...letter.paragraphs.map((p, i): [string, string] => [`paragraphs.${i}`, p]),
  ];
  for (const [path, value] of fields) {
    if (confirmed.has(path)) continue;
    const missing = checkFreeText(value, known);
    if (missing.length) map.set(path, missing);
  }
  return map;
}
