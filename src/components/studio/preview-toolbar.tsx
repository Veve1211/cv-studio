"use client";

import { useState } from "react";
import { postJson } from "@/lib/client-api";
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
  children?: React.ReactNode;
}

export function PreviewToolbar({
  cv,
  canUndo,
  onUndo,
  onSummary,
  grounding = null,
  cvActions = true,
  children,
}: PreviewToolbarProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  async function improve() {
    setBusy(true);
    setMessage(null);
    try {
      const data = await postJson("/api/summary", { cv });
      const summary = (data as { summary?: unknown } | null)?.summary;
      if (typeof summary !== "string" || !summary.trim()) throw new Error("Shrnutí se nepodařilo vylepšit.");
      onSummary(summary.trim());
      setMessage({ text: "Shrnutí je vylepšené. Nelíbí se? Klikni na Zpět.", error: false });
    } catch (err) {
      setMessage({ text: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mb-5 flex w-full max-w-[794px] flex-col gap-2 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto" />
        {cvActions && (
          <>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="border-line hover:border-brand-strong rounded-full border bg-white px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          Zpět
        </button>
        <button
          type="button"
          onClick={improve}
          disabled={busy}
          className="border-line hover:border-brand-strong rounded-full border bg-white px-4 py-2 text-sm font-medium transition disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Vylepšuji…" : "✨ Vylepšit shrnutí"}
        </button>
          </>
        )}
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
      </p>
    </div>
  );
}

function groundingText(n: number): string {
  if (n === 1) return "1 údaj jsme v tvém textu nenašli.";
  if (n < 5) return `${n} údaje jsme v tvém textu nenašli.`;
  return `${n} údajů jsme v tvém textu nenašli.`;
}
