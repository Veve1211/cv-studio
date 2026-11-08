"use client";

import { useCallback, useRef, useState } from "react";
import { postJson } from "@/lib/client-api";
import { setCvText } from "@/lib/cv/path";
import { CvSchema, type Cv } from "@/lib/cv/schema";

export type GenerateStatus = "idle" | "loading" | "ready" | "error";

const MAX_HISTORY = 50;

/**
 * Calls /api/cv and keeps the resulting CV in memory only (never persisted).
 * Edits are kept in a small undo history.
 */
export function useGenerate() {
  const [status, setStatus] = useState<GenerateStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cv, setCv] = useState<Cv | null>(null);
  const [history, setHistory] = useState<Cv[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const replace = useCallback((next: Cv) => {
    setCv(next);
    setHistory([]);
    setError(null);
    setStatus("ready");
  }, []);

  const generate = useCallback(
    async (text: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("loading");
      setError(null);
      try {
        const data = await postJson("/api/cv", { text }, controller.signal);
        const parsed = CvSchema.safeParse((data as { cv?: unknown } | null)?.cv);
        if (!parsed.success) throw new Error("Server vrátil nečekaná data. Zkus to prosím znovu.");
        replace(parsed.data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError((err as Error).message);
        setStatus("error");
      }
    },
    [replace],
  );

  const loadSample = useCallback(
    (sample: Cv) => {
      abortRef.current?.abort();
      replace(structuredClone(sample));
    },
    [replace],
  );

  /** Applies a change and remembers the previous version for undo. */
  const update = useCallback(
    (makeNext: (current: Cv) => Cv) => {
      if (!cv) return;
      const next = makeNext(cv);
      if (next === cv) return;
      setHistory((h) => [...h.slice(-(MAX_HISTORY - 1)), cv]);
      setCv(next);
    },
    [cv],
  );

  const editText = useCallback((path: string, value: string) => update((c) => setCvText(c, path, value)), [update]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    setCv(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  }, [history]);

  return { status, error, cv, canUndo: history.length > 0, generate, loadSample, editText, update, undo };
}
