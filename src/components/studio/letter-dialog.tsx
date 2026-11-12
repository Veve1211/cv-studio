"use client";

import { useEffect, useId, useRef, useState } from "react";
import { JOB_TEXT_LIMIT, prepareJobText } from "@/lib/letter/clean-job";
import { MIN_JOB_CHARS } from "@/lib/letter/schema";

interface LetterDialogProps {
  open: boolean;
  initialJob: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (job: string) => void;
  /** Texts, so the same dialog also serves "Přizpůsobit inzerátu". */
  title?: string;
  intro?: string;
  submitLabel?: string;
  busyLabel?: string;
}

/** Asks for the job ad (memory only). Used for the cover letter and for tailoring. */
export function LetterDialog({
  open,
  initialJob,
  busy,
  error,
  onClose,
  onSubmit,
  title = "Motivační dopis k inzerátu",
  intro = "Vlož text inzerátu. AI napíše dopis jen z údajů ve tvém životopise – nic si o tobě nevymyslí.",
  submitLabel = "Napsat motivační dopis",
  busyLabel = "Píšu dopis…",
}: LetterDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [job, setJob] = useState(initialJob);
  const [localError, setLocalError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fieldId = useId();
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Offer the ad the user already pasted elsewhere (memory only).
    if (open && !dialog.open && initialJob) setJob((current) => current || initialJob);
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open, initialJob]);

  const shown = localError ?? error;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className="m-auto w-[min(94vw,560px)] rounded-3xl p-0 shadow-2xl backdrop:bg-[rgb(11_27_51/0.45)] print:hidden"
    >
      <form
        ref={formRef}
        className="flex flex-col gap-3 p-6 sm:p-7"
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          // A whole copied web page: drop menus and footers, cap the length.
          const prepared = prepareJobText(job);
          if (prepared.text.length < MIN_JOB_CHARS) {
            setLocalError("Vlož prosím celý text inzerátu (aspoň pár vět).");
            return;
          }
          setLocalError(null);
          if (prepared.text !== job.trim()) setJob(prepared.text);
          setNote(
            prepared.truncated
              ? `Z textu jsme odstranili menu a patičku webu a zkrátili ho na ${JOB_TEXT_LIMIT.toLocaleString("cs-CZ")} znaků.`
              : prepared.cleaned
                ? "Z textu jsme odstranili menu a patičku webu."
                : null,
          );
          onSubmit(prepared.text);
        }}
      >
        <h2 id={titleId} className="font-display text-2xl font-bold tracking-tight">
          {title}
        </h2>
        <p className="text-muted text-[15px] leading-relaxed">{intro}</p>
        <label htmlFor={fieldId} className="text-sm font-semibold">
          Text inzerátu
        </label>
        <textarea
          id={fieldId}
          value={job}
          onChange={(e) => {
            setJob(e.target.value);
            if (localError) setLocalError(null);
            if (note) setNote(null);
          }}
          maxLength={60_000}
          rows={9}
          placeholder="Např. Hledáme účetní do našeho týmu v Ostravě. Požadujeme znalost Pohody…"
          className="border-line focus:border-brand-strong w-full resize-y rounded-2xl border bg-white px-4 py-3 text-[15px] leading-relaxed outline-none"
        />
        <p className="text-muted -mt-1 flex justify-between gap-3 text-xs">
          <span>{job.length > JOB_TEXT_LIMIT ? "Delší text před odesláním očistíme a zkrátíme." : "Klidně vlož celou stránku, menu a patičku odstraníme."}</span>
          <span aria-live="off" className="shrink-0 tabular-nums">
            {job.length.toLocaleString("cs-CZ")} / {JOB_TEXT_LIMIT.toLocaleString("cs-CZ")}
          </span>
        </p>
        {note && (
          <p role="status" className="bg-brand-soft text-ink rounded-xl px-4 py-2.5 text-sm">
            {note}
          </p>
        )}
        {shown && (
          <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            <span className="flex-1 basis-48">{shown}</span>
            {!localError && !busy && (
              <button
                type="button"
                onClick={() => formRef.current?.requestSubmit()}
                className="min-h-11 rounded-full border border-red-200 bg-white px-4 font-semibold text-red-900 transition hover:border-red-400"
              >
                Zkusit znovu
              </button>
            )}
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="btn-primary min-h-11 flex-1 rounded-full px-6 font-semibold disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? busyLabel : submitLabel}
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
