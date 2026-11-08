"use client";

import { useState } from "react";
import { postJson } from "@/lib/client-api";
import type { Cv } from "@/lib/cv/schema";

interface PreviewToolbarProps {
  cv: Cv;
  canUndo: boolean;
  onUndo: () => void;
  onSummary: (summary: string) => void;
  children?: React.ReactNode;
}

export function PreviewToolbar({ cv, canUndo, onUndo, onSummary, children }: PreviewToolbarProps) {
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
        <p className="text-muted mr-auto text-sm">
          <span aria-hidden>✎</span> Klikni do textu v životopise a přepiš ho.
        </p>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="border-line hover:border-ink rounded-full border bg-white px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          Zpět
        </button>
        <button
          type="button"
          onClick={improve}
          disabled={busy}
          className="border-line hover:border-ink rounded-full border bg-white px-4 py-2 text-sm font-medium transition disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Vylepšuji…" : "✨ Vylepšit shrnutí"}
        </button>
        {children}
      </div>
      <p
        role={message?.error ? "alert" : "status"}
        className={`min-h-5 text-sm ${message?.error ? "text-red-700" : "text-muted"}`}
      >
        {message?.text}
      </p>
    </div>
  );
}
