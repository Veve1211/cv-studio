"use client";

import { useCallback, useRef, useState } from "react";
import { postJson } from "@/lib/client-api";
import { setTextAt } from "@/lib/cv/path";
import type { Cv } from "@/lib/cv/schema";
import { letterDateLine, LetterDocSchema, LetterSchema, type LetterDoc } from "@/lib/letter/schema";

/** Cover letter state (memory only) – generated from the CV + a job ad. */
export function useLetter() {
  const [letter, setLetter] = useState<LetterDoc | null>(null);
  const [job, setJob] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The request in flight; a new one (or closing the dialog) cancels it. */
  const abortRef = useRef<AbortController | null>(null);
  /** Paths the user rewrote (not checked for invented facts any more). */
  const [confirmed, setConfirmed] = useState<ReadonlySet<string>>(new Set());

  const generate = useCallback(async (cv: Cv, jobText: string): Promise<boolean> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    try {
      const data = await postJson("/api/letter", { cv, job: jobText }, controller.signal);
      const parsed = LetterSchema.safeParse((data as { letter?: unknown } | null)?.letter);
      if (!parsed.success) throw new Error("Server vrátil nečekaná data. Zkus to prosím znovu.");
      setLetter({ ...parsed.data, dateLine: letterDateLine(cv.contact.location) });
      setJob(jobText);
      setConfirmed(new Set());
      return true;
    } catch (err) {
      if (!controller.signal.aborted) setError((err as Error).message);
      return false;
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setBusy(false);
      }
    }
  }, []);

  /** Stops waiting for the AI (dialog closed); the buttons work again right away. */
  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }, []);

  const editText = useCallback((path: string, value: string) => {
    setLetter((current) => (current ? setTextAt(current, path, value, LetterDocSchema) : current));
    setConfirmed((prev) => new Set(prev).add(path));
  }, []);

  const restore = useCallback((doc: LetterDoc | null) => {
    setLetter(doc);
    setConfirmed(new Set());
  }, []);

  return { letter, job, busy, error, setError, confirmed, generate, cancel, editText, restore };
}
