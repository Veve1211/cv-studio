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
  /** The text the CV was generated from (memory only) – used to spot invented facts. */
  const [source, setSource] = useState<string | null>(null);
  /** Paths the user rewrote themselves: their text, nothing to verify. */
  const [confirmed, setConfirmed] = useState<ReadonlySet<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  const replace = useCallback((next: Cv, from: string | null) => {
    setCv(next);
    setSource(from);
    setConfirmed(new Set());
    setHistory([]);
    setError(null);
    setStatus("ready");
  }, []);

  /** Resolves true when a CV was generated. */
  const generate = useCallback(
    async (text: string): Promise<boolean> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("loading");
      setError(null);
      try {
        const data = await postJson("/api/cv", { text }, controller.signal);
        const parsed = CvSchema.safeParse((data as { cv?: unknown } | null)?.cv);
        if (!parsed.success) throw new Error("Server vrátil nečekaná data. Zkus to prosím znovu.");
        replace(parsed.data, text);
        return true;
      } catch (err) {
        if (controller.signal.aborted) return false;
        setError((err as Error).message);
        setStatus("error");
        return false;
      }
    },
    [replace],
  );

  const loadSample = useCallback(
    (sample: Cv) => {
      abortRef.current?.abort();
      replace(structuredClone(sample), null);
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

  const editText = useCallback(
    (path: string, value: string) => {
      update((c) => setCvText(c, path, value));
      setConfirmed((prev) => new Set(prev).add(path));
    },
    [update],
  );

  /** New AI summary: it must be verified again. */
  const replaceSummary = useCallback(
    (summary: string) => {
      update((c) => ({ ...c, summary }));
      setConfirmed((prev) => {
        const next = new Set(prev);
        next.delete("summary");
        return next;
      });
    },
    [update],
  );

  const undo = useCallback(() => {
    if (history.length === 0) return;
    setCv(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  }, [history]);

  return {
    status,
    error,
    cv,
    source,
    confirmed,
    canUndo: history.length > 0,
    generate,
    loadSample,
    editText,
    replaceSummary,
    update,
    undo,
  };
}
