"use client";

import { useId, type FormEvent, type RefObject } from "react";
import { MAX_INPUT_CHARS } from "@/lib/cv/schema";
import { ExampleChips } from "./example-chips";
import { UploadButton } from "./file-upload";

/** The left panel form: free text about yourself, examples, upload, errors, create / sample. */
export function CvTextForm({
  formRef,
  textareaRef,
  text,
  onTextChange,
  onExample,
  replacedText,
  onRestoreText,
  error,
  canRetry,
  upload,
  uploadNote,
  loading,
  onSubmit,
  onSample,
}: {
  formRef: RefObject<HTMLFormElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  text: string;
  onTextChange: (value: string) => void;
  onExample: (example: string) => void;
  /** The user's own text replaced by an example (offered back), or null. */
  replacedText: string | null;
  onRestoreText: () => void;
  error: string | null;
  /** A server error can be retried; a local validation error cannot. */
  canRetry: boolean;
  upload: { busy: boolean; error: string | null; onFile: (file: File) => void };
  uploadNote: string | null;
  loading: boolean;
  onSubmit: (event: FormEvent) => void;
  onSample: () => void;
}) {
  const textareaId = useId();
  const hintId = useId();
  const errorId = useId();

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mt-6 flex flex-col gap-3" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={textareaId} className="text-sm font-semibold">
          Napiš o sobě cokoliv
        </label>
        <UploadButton busy={upload.busy} onFile={upload.onFile} />
      </div>
      <textarea
        ref={textareaRef}
        id={textareaId}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        maxLength={MAX_INPUT_CHARS}
        onKeyDown={(e) => {
          // Ctrl/Cmd + Enter submits, plain Enter stays a new line.
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) e.currentTarget.form?.requestSubmit();
        }}
        rows={14}
        aria-describedby={`${hintId}${error ? ` ${errorId}` : ""}`}
        aria-invalid={Boolean(error) || undefined}
        placeholder={
          "Klidně neučesaně, třeba:\n\nJana, Ostrava. 4 roky v účtárně u firmy Ocel a.s., předtím 2 roky na recepci v hotelu. Umím Excel, Pohodu, angličtina B2. Vystudovala jsem obchodní akademii…"
        }
        className="border-line focus:border-brand-strong field-glow min-h-[260px] w-full resize-y rounded-3xl border bg-white/80 shadow-[0_1px_2px_rgba(10,60,120,0.06)] px-4 py-3.5 text-[15px] leading-relaxed outline-none transition-colors lg:min-h-[340px]"
      />
      <div className="text-muted flex justify-between text-xs">
        <span id={hintId}>
          Text neukládáme, pošle se jen do AI (Claude). Co doplní navíc, označíme žlutě.
          <span className="hidden lg:inline"> Odeslat: Ctrl + Enter.</span>
        </span>
        <span aria-live="off" className="shrink-0 whitespace-nowrap pl-3 tabular-nums">
          {text.length.toLocaleString("cs-CZ")} / {MAX_INPUT_CHARS.toLocaleString("cs-CZ")}
        </span>
      </div>
      <ExampleChips onPick={onExample} />
      {replacedText !== null && (
        <button
          type="button"
          onClick={onRestoreText}
          className="text-brand-strong self-start text-sm font-semibold underline underline-offset-4"
        >
          ↩ Vrátit můj text
        </button>
      )}

      {error && (
        <div id={errorId} role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="flex-1 basis-48">{error}</span>
          {canRetry && (
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
      {upload.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {upload.error}
        </p>
      )}
      {uploadNote && (
        <p role="status" className="bg-brand-soft text-ink rounded-xl px-4 py-3 text-sm">
          {uploadNote}
        </p>
      )}

      <div className="mt-1 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 rounded-full px-6 py-3.5 text-[15px] font-semibold transition disabled:cursor-wait disabled:opacity-60 max-lg:hidden"
        >
          {loading ? "Vytvářím…" : "Vytvořit životopis"}
        </button>
        <button
          type="button"
          onClick={onSample}
          className="text-brand-strong rounded-full px-4 py-3.5 text-[15px] font-semibold underline-offset-4 transition hover:underline max-lg:min-h-11 max-lg:py-2"
        >
          Ukázka
        </button>
      </div>
    </form>
  );
}
