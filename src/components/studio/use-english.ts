"use client";

import { useCallback, useState } from "react";
import { postJson } from "@/lib/client-api";
import { setCvText, setTextAt } from "@/lib/cv/path";
import { CvSchema, type Cv } from "@/lib/cv/schema";
import { LetterDocSchema, LetterSchema, type LetterDoc } from "@/lib/letter/schema";

interface EnglishState {
  cv: Cv;
  letter: LetterDoc | null;
  /** The Czech versions it was translated from (to spot a stale translation). */
  fromCv: Cv;
  fromLetter: LetterDoc | null;
}

function englishDateLine(location: string, date = new Date()): string {
  const d = date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return location.trim() ? `${location.trim()}, ${d}` : d;
}

/** English version of the CV and letter, kept in memory next to the Czech one. */
export function useEnglish() {
  const [state, setState] = useState<EnglishState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ReadonlySet<string>>(new Set());

  const translate = useCallback(async (cv: Cv, letter: LetterDoc | null): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      const plainLetter = letter
        ? { recipient: letter.recipient, greeting: letter.greeting, paragraphs: letter.paragraphs, closing: letter.closing }
        : null;
      const data = (await postJson("/api/translate", { cv, letter: plainLetter })) as { cv?: unknown; letter?: unknown };
      const en = CvSchema.safeParse(data?.cv);
      if (!en.success) throw new Error("Server vrátil nečekaná data. Zkus to prosím znovu.");
      const enLetter = letter ? LetterSchema.safeParse(data?.letter) : null;
      if (enLetter && !enLetter.success) throw new Error("Dopis se nepodařilo přeložit. Zkus to prosím znovu.");
      setState({
        cv: en.data,
        letter: enLetter?.success ? { ...enLetter.data, dateLine: englishDateLine(cv.contact.location) } : null,
        fromCv: cv,
        fromLetter: letter,
      });
      setConfirmed(new Set());
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const editCv = useCallback((path: string, value: string) => {
    setState((s) => (s ? { ...s, cv: setCvText(s.cv, path, value) } : s));
    setConfirmed((prev) => new Set(prev).add(path));
  }, []);

  const editLetter = useCallback((path: string, value: string) => {
    setState((s) => (s?.letter ? { ...s, letter: setTextAt(s.letter, path, value, LetterDocSchema) } : s));
    setConfirmed((prev) => new Set(prev).add(`letter:${path}`));
  }, []);

  const clear = useCallback(() => {
    setState(null);
    setError(null);
  }, []);

  return { state, busy, error, setError, confirmed, translate, editCv, editLetter, clear };
}
