"use client";

import { useEffect, useRef, useState } from "react";
import { postJson } from "@/lib/client-api";
import { MoreItem, MoreMenu } from "./more-menu";
import type { Cv } from "@/lib/cv/schema";

interface PreviewToolbarProps {
  cv: Cv;
  canUndo: boolean;
  onUndo: () => void;
  onSummary: (summary: string) => void;
  /** Number of facts not found in the user's text; null = nothing to compare (sample). */
  grounding?: number | null;
  /** Hide CV-only actions (undo, summary) while the cover letter is shown. */
  cvActions?: boolean;
  /** Extra items for the "Další možnosti" menu. */
  moreItems?: React.ReactNode;
  children?: React.ReactNode;
}

export function PreviewToolbar({
  cv,
  canUndo,
  onUndo,
  onSummary,
  grounding = null,
  cvActions = true,
  moreItems,
  children,
}: PreviewToolbarProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Leaving the CV (new CV, letter view) cancels a summary still in flight.
  useEffect(() => () => abortRef.current?.abort(), []);

  async function improve() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setMessage(null);
    try {
      const data = await postJson("/api/summary", { cv }, controller.signal);
      const summary = (data as { summary?: unknown } | null)?.summary;
      if (typeof summary !== "string" || !summary.trim()) throw new Error("Shrnutí se nepodařilo vylepšit.");
      onSummary(summary.trim());
      setMessage({ text: "Shrnutí je vylepšené. Nelíbí se? Klikni na Zpět.", error: false });
    } catch (err) {
      if (!controller.signal.aborted) setMessage({ text: (err as Error).message, error: true });
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <div className="mx-auto mb-5 flex w-full max-w-[794px] flex-col gap-2 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto" />
        {(cvActions || moreItems) && (
          <MoreMenu>
            {cvActions && (
              <>
                <MoreItem onClick={onUndo} disabled={!canUndo}>
                  ↶ Zpět
                </MoreItem>
                <MoreItem onClick={improve} disabled={busy}>
                  ✨ Vylepšit shrnutí
                </MoreItem>
              </>
            )}
            {moreItems}
          </MoreMenu>
        )}
        {busy && <span className="text-muted text-sm">Vylepšuji shrnutí…</span>}
        {children}
      </div>
      {grounding !== null && (
        <p
          data-testid="grounding-summary"
          className={`rounded-xl px-4 py-2.5 text-sm ${
            grounding > 0 ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900"
          }`}
        >
          {grounding > 0 ? (
            <>
              <span aria-hidden>⚠️ </span>
              {groundingText(grounding)} Jsou <span className="cv-unverified-sample">podtržené žlutě</span> – zkontroluj
              je, nebo je přepiš.
            </>
          ) : (
            <>
              <span aria-hidden>✓ </span>Firmy, školy, roky, čísla i dovednosti sedí s tvým textem.
            </>
          )}
        </p>
      )}
      <p
        role={message?.error ? "alert" : "status"}
        className={`min-h-5 text-sm ${message?.error ? "text-red-700" : "text-muted"}`}
      >
        {message?.text}
        {message?.error && (
          <button type="button" onClick={improve} className="ml-2 font-semibold underline underline-offset-2">
            Zkusit znovu
          </button>
        )}
      </p>
    </div>
  );
}

function groundingText(n: number): string {
  if (n === 1) return "1 údaj jsme v tvém textu nenašli.";
  if (n < 5) return `${n} údaje jsme v tvém textu nenašli.`;
  return `${n} údajů jsme v tvém textu nenašli.`;
}
