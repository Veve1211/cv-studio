"use client";

import { useCallback, useRef, useState } from "react";
import { CvSchema, type Cv } from "@/lib/cv/schema";

export type GenerateStatus = "idle" | "loading" | "ready" | "error";

/** Calls /api/cv and keeps the resulting CV in memory only (never persisted). */
export function useGenerate() {
  const [status, setStatus] = useState<GenerateStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cv, setCv] = useState<Cv | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (text: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Něco se pokazilo. Zkus to prosím znovu.";
        throw new Error(message);
      }
      const parsed = CvSchema.safeParse((data as { cv?: unknown } | null)?.cv);
      if (!parsed.success) throw new Error("Server vrátil nečekaná data. Zkus to prosím znovu.");
      setCv(parsed.data);
      setStatus("ready");
    } catch (err) {
      if (controller.signal.aborted) return;
      const offline = err instanceof TypeError;
      setError(offline ? "Nepodařilo se spojit se serverem. Jsi online?" : (err as Error).message);
      setStatus("error");
    }
  }, []);

  const loadSample = useCallback((sample: Cv) => {
    abortRef.current?.abort();
    setCv(structuredClone(sample));
    setError(null);
    setStatus("ready");
  }, []);

  return { status, error, cv, setCv, generate, loadSample };
}
