"use client";

import { useCallback, useRef, useState } from "react";
import { postJson } from "@/lib/client-api";
import type { Cv } from "@/lib/cv/schema";
import { applyTailor, type TailorResult } from "@/lib/tailor/apply";
import { TailorSchema } from "@/lib/tailor/schema";

export interface TailorState {
  /** The CV before tailoring, for "Vrátit původní pořadí". */
  before: Cv;
  analysis: TailorResult["analysis"];
}

/** Job ad tailoring (memory only): the AI only reorders and rewrites the summary. */
export function useTailor() {
  const [state, setState] = useState<TailorState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The request in flight; a new one (or closing the dialog) cancels it. */
  const abortRef = useRef<AbortController | null>(null);

  /** Resolves the applied result, or null on error. */
  const run = useCallback(async (cv: Cv, job: string): Promise<TailorResult | null> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    try {
      const data = await postJson("/api/tailor", { cv, job }, controller.signal);
      const parsed = TailorSchema.safeParse((data as { tailor?: unknown } | null)?.tailor);
      if (!parsed.success) throw new Error("Server vrátil nečekaná data. Zkus to prosím znovu.");
      const result = applyTailor(cv, parsed.data);
      setState((prev) => ({ before: prev?.before ?? cv, analysis: result.analysis }));
      return result;
    } catch (err) {
      if (!controller.signal.aborted) setError((err as Error).message);
      return null;
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

  const clear = useCallback(() => setState(null), []);

  return { state, busy, error, setError, run, cancel, clear };
}
