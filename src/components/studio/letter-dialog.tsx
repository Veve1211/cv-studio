"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MAX_JOB_CHARS, MIN_JOB_CHARS } from "@/lib/letter/schema";

interface LetterDialogProps {
  open: boolean;
  initialJob: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (job: string) => void;
}

export function LetterDialog({ open, initialJob, busy, error, onClose, onSubmit }: LetterDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [job, setJob] = useState(initialJob);
  const [localError, setLocalError] = useState<string | null>(null);
  const fieldId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const shown = localError ?? error;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="letter-title"
      className="m-auto w-[min(94vw,560px)] rounded-3xl p-0 shadow-2xl backdrop:bg-[rgb(11_27_51/0.45)] print:hidden"
    >
      <form
        className="flex flex-col gap-3 p-6 sm:p-7"
        onSubmit={(e) => {
          e.preventDefault();
          if (job.trim().length < MIN_JOB_CHARS) {
            setLocalError("Vlož prosím celý text inzerátu (aspoň pár vět).");
            return;
          }
          setLocalError(null);
          onSubmit(job.trim());
        }}
      >
        <h2 id="letter-title" className="font-display text-2xl font-bold tracking-tight">
          Motivační dopis k inzerátu
        </h2>
        <p className="text-muted text-[15px] leading-relaxed">
          Vlož text inzerátu. AI napíše dopis jen z údajů ve tvém životopise – nic si o tobě nevymyslí.
        </p>
        <label htmlFor={fieldId} className="text-sm font-semibold">
          Text inzerátu
        </label>
        <textarea
          id={fieldId}
          value={job}
          onChange={(e) => {
            setJob(e.target.value);
            if (localError) setLocalError(null);
          }}
          maxLength={MAX_JOB_CHARS}
          rows={9}
          placeholder="Např. Hledáme účetní do našeho týmu v Ostravě. Požadujeme znalost Pohody…"
          className="border-line focus:border-brand-strong w-full resize-y rounded-2xl border bg-white px-4 py-3 text-[15px] leading-relaxed outline-none"
        />
        {shown && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {shown}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="btn-primary min-h-11 flex-1 rounded-full px-6 font-semibold disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Píšu dopis…" : "Napsat motivační dopis"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border-line hover:border-brand-strong min-h-11 rounded-full border px-5 font-medium"
          >
            Zrušit
          </button>
        </div>
      </form>
    </dialog>
  );
}
