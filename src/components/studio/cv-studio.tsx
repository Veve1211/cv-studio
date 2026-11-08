"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { A4Preview } from "@/components/preview/a4-preview";
import { DEFAULT_TEMPLATE, getTemplate } from "@/components/templates";
import type { TemplateId } from "@/components/templates/types";
import { SAMPLE_CV } from "@/lib/cv/sample";
import { MAX_INPUT_CHARS, MIN_INPUT_CHARS } from "@/lib/cv/schema";
import { DEFAULT_ACCENT } from "@/components/templates/palette";
import { AccentPicker } from "./accent-picker";
import { LoadingPage } from "./loading-page";
import { TemplatePicker } from "./template-picker";
import { EditContext } from "@/components/templates/edit-context";
import { DownloadPdfButton } from "./download-pdf-button";
import { PreviewToolbar } from "./preview-toolbar";
import { useGenerate } from "./use-generate";

export function CvStudio() {
  const [text, setText] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>(DEFAULT_TEMPLATE);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [localError, setLocalError] = useState<string | null>(null);
  const { status, error, cv, canUndo, generate, loadSample, editText, update, undo } = useGenerate();
  const editApi = useMemo(() => ({ onEdit: editText }), [editText]);
  const previewRef = useRef<HTMLHeadingElement>(null);
  const textareaId = useId();
  const hintId = useId();
  const errorId = useId();

  const template = getTemplate(templateId);
  const shownError = localError ?? (status === "error" ? error : null);

  // On small screens the preview sits below the form: bring it into view when ready.
  useEffect(() => {
    if (status !== "ready" && status !== "loading") return;
    if (window.matchMedia("(max-width: 1023px)").matches) {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (value.length < MIN_INPUT_CHARS) {
      setLocalError("Napiš o sobě prosím aspoň pár vět.");
      return;
    }
    setLocalError(null);
    void generate(value);
  }

  const loading = status === "loading";

  return (
    <div id="studio" className="grid w-full flex-1 lg:grid-cols-[minmax(360px,440px)_1fr] print:block">
      <section
        aria-labelledby="studio-title"
        className="border-line bg-white px-4 py-8 sm:px-8 lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-r print:hidden"
      >
        <h2 id="studio-title" className="font-display text-3xl font-semibold tracking-tight">
          Tvůj životopis
        </h2>
        <p className="text-muted mt-2 text-[15px] leading-relaxed">
          Žádný formulář. Vlož cokoliv: starý životopis, text z LinkedInu nebo jen odrážky.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3" noValidate>
          <label htmlFor={textareaId} className="text-sm font-semibold">
            Napiš o sobě cokoliv
          </label>
          <textarea
            id={textareaId}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (localError) setLocalError(null);
            }}
            maxLength={MAX_INPUT_CHARS}
            rows={14}
            aria-describedby={`${hintId}${shownError ? ` ${errorId}` : ""}`}
            aria-invalid={Boolean(shownError) || undefined}
            placeholder={
              "Klidně neučesaně, třeba:\n\nJana, Ostrava. 4 roky v účtárně u firmy Ocel a.s., předtím 2 roky na recepci v hotelu. Umím Excel, Pohodu, angličtina B2. Vystudovala jsem obchodní akademii…"
            }
            className="border-line bg-paper-soft focus:border-ink min-h-[260px] w-full resize-y rounded-2xl border px-4 py-3.5 text-[15px] leading-relaxed outline-none transition-colors lg:min-h-[340px]"
          />
          <div className="text-muted flex justify-between text-xs">
            <span id={hintId}>Text nikam neukládáme. AI ho jen učeše, nic si nevymýšlí.</span>
            <span aria-live="off" className="shrink-0 whitespace-nowrap pl-3 tabular-nums">
              {text.length.toLocaleString("cs-CZ")} / {MAX_INPUT_CHARS.toLocaleString("cs-CZ")}
            </span>
          </div>

          {shownError && (
            <p id={errorId} role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {shownError}
            </p>
          )}

          <div className="mt-1 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-ink hover:bg-ink/90 flex-1 rounded-full px-6 py-3.5 text-[15px] font-semibold text-white transition disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? "Vytvářím…" : "Vytvořit životopis"}
            </button>
            <button
              type="button"
              onClick={() => {
                setLocalError(null);
                loadSample(SAMPLE_CV);
              }}
              className="border-line hover:border-ink rounded-full border px-5 py-3.5 text-[15px] font-medium transition"
            >
              Ukázka
            </button>
          </div>
        </form>
      </section>

      <section aria-labelledby="preview-title" className="bg-canvas flex min-w-0 flex-col print:block print:bg-transparent">
        <h2 id="preview-title" ref={previewRef} tabIndex={-1} className="sr-only">
          Náhled
        </h2>
        <div className="border-line bg-canvas/95 flex flex-col gap-4 border-b px-4 pb-3 pt-5 backdrop-blur sm:px-8 xl:flex-row xl:items-end xl:justify-between print:hidden">
          <TemplatePicker value={templateId} onChange={setTemplateId} accent={accent} cv={cv} />
          <AccentPicker value={accent} onChange={setAccent} />
        </div>
        <div className="flex-1 px-4 py-8 sm:px-8 lg:py-10 print:p-0">
          {loading ? (
            <LoadingPage />
          ) : cv ? (
            <>
              <PreviewToolbar
                cv={cv}
                canUndo={canUndo}
                onUndo={undo}
                onSummary={(summary) => update((c) => ({ ...c, summary }))}
              >
                <DownloadPdfButton name={cv.name} />
              </PreviewToolbar>
              <A4Preview accent={accent} paper={template.paper} templateId={template.id}>
                <EditContext value={editApi}>
                  <template.Component cv={cv} />
                </EditContext>
              </A4Preview>
            </>
          ) : (
            <EmptyPreview />
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="mx-auto w-full max-w-[560px]">
      <div className="border-line grid aspect-[210/297] w-full place-items-center rounded-sm border-2 border-dashed bg-white/50 p-8 text-center">
        <div>
          <p className="font-display text-2xl">Tady se objeví tvůj životopis</p>
          <p className="text-muted mt-2 text-sm">Napiš o sobě pár vět, nebo klikni na „Ukázka“.</p>
        </div>
      </div>
    </div>
  );
}
