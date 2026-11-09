"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { A4Preview } from "@/components/preview/a4-preview";
import { DEFAULT_TEMPLATE, getTemplate } from "@/components/templates";
import type { TemplateId } from "@/components/templates/types";
import { EXAMPLES } from "@/lib/cv/examples";
import { SAMPLE_CV } from "@/lib/cv/sample";
import { MAX_INPUT_CHARS, MIN_INPUT_CHARS } from "@/lib/cv/schema";
import { DEFAULT_ACCENT } from "@/components/templates/palette";
import { AccentPicker } from "./accent-picker";
import { DropArea, UploadButton, useFileUpload, type UploadResult } from "./file-upload";
import { ExampleChips } from "./example-chips";
import { LoadingPage } from "./loading-page";
import { MobileBar, ZoomControls, type MobileView } from "./mobile-bar";
import { TemplatePicker } from "./template-picker";
import { EditContext } from "@/components/templates/edit-context";
import { GroundingContext } from "@/components/templates/grounding-context";
import { checkFreeText, checkGrounding } from "@/lib/cv/grounding";
import { LetterPage } from "@/components/letter/letter-page";
import { DocTabs, type DocKind } from "./doc-tabs";
import { LetterDialog } from "./letter-dialog";
import { useLetter } from "./use-letter";
import { DownloadPdfButton, printCv } from "./download-pdf-button";
import { PaywallDialog } from "./paywall-dialog";
import { usePaywall } from "./use-paywall";
import { NextSteps } from "./next-steps";
import { KofiLink } from "@/components/site/kofi-link";
import { PreviewToolbar } from "./preview-toolbar";
import { useGenerate } from "./use-generate";
import { TailorPanel } from "./tailor-panel";
import { LangSwitch } from "./lang-switch";
import { useEnglish } from "./use-english";
import type { CvLang } from "@/components/templates/labels";
import { checkTranslation } from "@/lib/translate/translate";
import { checkNumbersAndYears } from "@/lib/cv/grounding";
import { useTailor } from "./use-tailor";

const EXAMPLE_TEXTS: ReadonlySet<string> = new Set(EXAMPLES.map((e) => e.text));

export function CvStudio({ kofiUrl = null }: { kofiUrl?: string | null }) {
  const [text, setText] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>(DEFAULT_TEMPLATE);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [localError, setLocalError] = useState<string | null>(null);
  const {
    status,
    error,
    cv,
    source,
    confirmed,
    canUndo,
    generate,
    loadSample,
    editText,
    replaceSummary,
    applyReordered,
    update,
    undo,
  } = useGenerate();
  const tailor = useTailor();
  const english = useEnglish();
  const [lang, setLang] = useState<CvLang>("cs");
  const [tailorOpen, setTailorOpen] = useState(false);
  /** The last job ad the user pasted (memory only), offered again for the letter. */
  const [jobAd, setJobAd] = useState("");
  const [paywallOpen, setPaywallOpen] = useState(false);
  /** Gentle "support us" note after a PDF download (only with KOFI_URL). */
  const [askSupport, setAskSupport] = useState(false);
  const [paywallReason, setPaywallReason] = useState("PDF bez vodoznaku");

  const letterState = useLetter();
  const [doc, setDoc] = useState<DocKind>("cv");
  const [letterOpen, setLetterOpen] = useState(false);
  const [view, setView] = useState<MobileView>("text");
  const [zoom, setZoom] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);
  const paywall = usePaywall((snapshot) => {
    loadSample(snapshot.cv);
    setView("preview");
    setTemplateId(snapshot.templateId);
    setAccent(snapshot.accent);
    letterState.restore(snapshot.letter ?? null);
    setDoc(snapshot.doc ?? "cv");
  });
  const editApi = useMemo(() => ({ onEdit: editText }), [editText]);
  // Facts the AI wrote that are not in the user's text (code check, never AI).
  const unverified = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!cv || source === null) return map;
    for (const flag of checkGrounding(cv, source)) {
      if (!confirmed.has(flag.path)) map.set(flag.path, flag.missing);
    }
    return map;
  }, [cv, source, confirmed]);
  const letterEditApi = useMemo(() => ({ onEdit: letterState.editText }), [letterState.editText]);
  // Same check for the cover letter: numbers, years and names must come from the CV,
  // the user's text or the job ad.
  const letterUnverified = useMemo(() => {
    const map = new Map<string, string[]>();
    const letter = letterState.letter;
    if (!cv || !letter) return map;
    const known = [source ?? "", letterState.job, JSON.stringify(cv)].join("\n");
    const fields: Array<[string, string]> = [
      ["recipient", letter.recipient],
      ...letter.paragraphs.map((p, i): [string, string] => [`paragraphs.${i}`, p]),
    ];
    for (const [path, value] of fields) {
      if (letterState.confirmed.has(path)) continue;
      const missing = checkFreeText(value, known);
      if (missing.length) map.set(path, missing);
    }
    return map;
  }, [cv, source, letterState.letter, letterState.job, letterState.confirmed]);
  const previewRef = useRef<HTMLHeadingElement>(null);

  // English version: both languages stay in memory, switching never calls the AI again.
  const en = english.state;
  const enActive = lang === "en" && en !== null;
  const shownCv = enActive ? en.cv : cv;
  const shownLetter = enActive ? en.letter : letterState.letter;
  const englishStale = en !== null && (en.fromCv !== cv || en.fromLetter !== letterState.letter);
  // Translation check: numbers and years must match the Czech version (names and
  // companies are copied over in code, never translated).
  const enUnverified = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!en) return map;
    for (const [path, missing] of checkTranslation(en.cv, en.fromCv)) {
      if (!english.confirmed.has(path)) map.set(path, missing);
    }
    return map;
  }, [en, english.confirmed]);
  const enLetterUnverified = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!en?.letter) return map;
    const known = JSON.stringify([en.fromCv, en.fromLetter]);
    en.letter.paragraphs.forEach((p, i) => {
      const missing = checkNumbersAndYears(p, known);
      if (missing.length && !english.confirmed.has(`letter:paragraphs.${i}`)) map.set(`paragraphs.${i}`, missing);
    });
    return map;
  }, [en, english.confirmed]);
  const enEditApi = useMemo(() => ({ onEdit: english.editCv }), [english.editCv]);
  const enLetterEditApi = useMemo(() => ({ onEdit: english.editLetter }), [english.editLetter]);

  function switchLang(next: CvLang) {
    if (next === "cs" || !cv) {
      setLang("cs");
      return;
    }
    if (en) {
      setLang("en");
      return;
    }
    if (paywall.locked) {
      withAccess("Anglická verze", () => {});
      return;
    }
    void english.translate(cv, letterState.letter).then((ok) => ok && setLang("en"));
  }

  function resetEnglish() {
    english.clear();
    setLang("cs");
  }

  const [uploadNote, setUploadNote] = useState<string | null>(null);
  /** The user's own text, kept when an example replaced it (memory only). */
  const [replacedText, setReplacedText] = useState<string | null>(null);
  /** "Klikni do textu…" disappears after the first click into the CV. */
  const [hintDismissed, setHintDismissed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const onUploadedText = useCallback((result: UploadResult) => {
    setText(result.text);
    setLocalError(null);
    setUploadNote(
      `Načteno ze souboru ${result.fileName}.${result.truncated ? " Text byl moc dlouhý, zkrátili jsme ho." : ""} Zkontroluj ho a klikni na „Vytvořit životopis“. Soubor nikam neukládáme.`,
    );
    textareaRef.current?.focus();
  }, [setUploadNote]);
  const fileUpload = useFileUpload(onUploadedText);
  const textareaId = useId();
  const hintId = useId();
  const errorId = useId();

  const template = getTemplate(templateId);
  const shownError = localError ?? (status === "error" ? error : null);


  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (value.length < MIN_INPUT_CHARS) {
      setLocalError("Napiš o sobě prosím aspoň pár vět.");
      return;
    }
    setLocalError(null);
    // Phones: show the loading steps in the preview, back to the text on error.
    setView("preview");
    letterState.restore(null);
    tailor.clear();
    resetEnglish();
    setDoc("cv");
    void generate(value).then((ok) => {
      if (!ok) setView("text");
    });
  }

  const loading = status === "loading";

  /** Paid features: run right away with full access, otherwise offer access first. */
  function withAccess(reason: string, action: () => void) {
    if (paywall.locked) {
      setPaywallReason(reason);
      setPaywallOpen(true);
      return;
    }
    action();
  }

  /** No paywall: browser print. Paywall: dialog first, then a clean PDF from the server. */
  function downloadPdf() {
    if (!cv) return;
    if (!paywall.config?.enabled) {
      setAskSupport(true);
      if (enActive) printCv(cv.name, doc === "letter" ? "Cover-letter" : "CV");
      else printCv(cv.name, doc === "letter" ? "Motivacni-dopis" : undefined);
      return;
    }
    if (!paywall.paid) {
      setPaywallReason("PDF bez vodoznaku");
      setPaywallOpen(true);
      return;
    }
    setAskSupport(true);
    void paywall.downloadServerPdf({
      cv: shownCv ?? cv,
      templateId,
      accent,
      letter: shownLetter,
      doc,
      lang: enActive ? "en" : "cs",
    });
  }

  return (
    <div id="studio" className="grid w-full flex-1 scroll-mt-20 pb-24 lg:scroll-mt-0 lg:grid-cols-[minmax(360px,440px)_1fr] lg:pb-0 print:block print:pb-0">
      <DropArea
        onFile={(file) => void fileUpload.upload(file)}
        className={`border-line bg-white/70 px-4 py-8 backdrop-blur-xl sm:px-8 lg:sticky lg:top-0 lg:pt-24 lg:h-dvh lg:overflow-y-auto lg:border-r print:hidden ${
          view === "preview" ? "max-lg:hidden" : ""
        }`}
      >
        {paywall.demoUntil !== null && (
          <p
            data-testid="demo-badge"
            className="bg-brand-soft text-ink mb-4 w-fit rounded-full px-3.5 py-1.5 text-sm font-semibold"
          >
            <span aria-hidden>🎤 </span>Prezentační režim · vše odemčené do {formatTime(paywall.demoUntil)}
          </p>
        )}
        {paywall.config?.enabled && paywall.config.access && (
          <p data-testid="access-badge" className="bg-brand-soft text-ink mb-4 rounded-2xl px-3.5 py-2 text-sm">
            <span className="font-semibold">
              <span aria-hidden>✨ </span>Plný přístup do {formatDate(paywall.config.access.until)}
            </span>
            <span className="text-muted block">
              Kód pro jiné zařízení: <code className="text-ink font-mono font-semibold">{paywall.config.access.code}</code>
            </span>
          </p>
        )}
        {paywall.demoError && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {paywall.demoError}
          </p>
        )}
        <h2 id="studio-title" className="font-display text-3xl font-bold tracking-[-0.03em]">
          Tvůj životopis
        </h2>
        <p className="text-muted mt-2 text-[15px] leading-relaxed">
          Žádný formulář. Vlož cokoliv: starý životopis, text z LinkedInu nebo jen odrážky.
        </p>

        <form ref={formRef} onSubmit={onSubmit} className="mt-6 flex flex-col gap-3" noValidate>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={textareaId} className="text-sm font-semibold">
              Napiš o sobě cokoliv
            </label>
            <UploadButton busy={fileUpload.busy} onFile={(file) => void fileUpload.upload(file)} />
          </div>
          <textarea
            ref={textareaRef}
            id={textareaId}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (localError) setLocalError(null);
              if (uploadNote) setUploadNote(null);
              if (replacedText !== null) setReplacedText(null);
            }}
            maxLength={MAX_INPUT_CHARS}
            onKeyDown={(e) => {
              // Ctrl/Cmd + Enter submits, plain Enter stays a new line.
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) e.currentTarget.form?.requestSubmit();
            }}
            rows={14}
            aria-describedby={`${hintId}${shownError ? ` ${errorId}` : ""}`}
            aria-invalid={Boolean(shownError) || undefined}
            placeholder={
              "Klidně neučesaně, třeba:\n\nJana, Ostrava. 4 roky v účtárně u firmy Ocel a.s., předtím 2 roky na recepci v hotelu. Umím Excel, Pohodu, angličtina B2. Vystudovala jsem obchodní akademii…"
            }
            className="border-line focus:border-brand-strong field-glow min-h-[260px] w-full resize-y rounded-3xl border bg-white/80 shadow-[0_1px_2px_rgba(10,60,120,0.06)] px-4 py-3.5 text-[15px] leading-relaxed outline-none transition-colors lg:min-h-[340px]"
          />
          <div className="text-muted flex justify-between text-xs">
            <span id={hintId}>
              Text nikam neukládáme. AI ho jen učeše, nic si nevymýšlí.
              <span className="hidden lg:inline"> Odeslat: Ctrl + Enter.</span>
            </span>
            <span aria-live="off" className="shrink-0 whitespace-nowrap pl-3 tabular-nums">
              {text.length.toLocaleString("cs-CZ")} / {MAX_INPUT_CHARS.toLocaleString("cs-CZ")}
            </span>
          </div>
          <ExampleChips
            onPick={(example) => {
              if (text.trim() && text !== example && !EXAMPLE_TEXTS.has(text)) setReplacedText(text);
              setText(example);
              setLocalError(null);
              setUploadNote(null);
            }}
          />
          {replacedText !== null && (
            <button
              type="button"
              onClick={() => {
                setText(replacedText);
                setReplacedText(null);
              }}
              className="text-brand-strong self-start text-sm font-semibold underline underline-offset-4"
            >
              ↩ Vrátit můj text
            </button>
          )}

          {shownError && (
            <div id={errorId} role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              <span className="flex-1 basis-48">{shownError}</span>
              {!localError && (
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
          {fileUpload.error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {fileUpload.error}
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
              onClick={() => {
                setLocalError(null);
                loadSample(SAMPLE_CV);
                letterState.restore(null);
                tailor.clear();
                resetEnglish();
                setDoc("cv");
                setView("preview");
              }}
              className="text-brand-strong rounded-full px-4 py-3.5 text-[15px] font-semibold underline-offset-4 transition hover:underline max-lg:min-h-11 max-lg:py-2"
            >
              Ukázka
            </button>
          </div>
        </form>
      </DropArea>

      <section
        aria-labelledby="preview-title"
        className={`bg-canvas flex min-w-0 flex-col lg:pt-[4.5rem] print:block print:bg-transparent ${
          view === "text" ? "max-lg:hidden" : ""
        }`}
      >
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
                onSummary={replaceSummary}
                grounding={
                  enActive
                    ? doc === "letter"
                      ? enLetterUnverified.size
                      : enUnverified.size
                    : doc === "letter"
                      ? letterUnverified.size
                      : source === null
                        ? null
                        : unverified.size
                }
                cvActions={doc === "cv" && !enActive}
              >
                <LangSwitch value={enActive ? "en" : "cs"} onChange={switchLang} busy={english.busy} />
                <DownloadPdfButton onClick={downloadPdf} busy={paywall.downloading} />
              </PreviewToolbar>
              {english.busy && (
                <p role="status" className="text-muted mx-auto mb-4 max-w-[794px] text-sm print:hidden">
                  Překládám do angličtiny…
                </p>
              )}
              {english.error && (
                <p role="alert" className="mx-auto mb-4 max-w-[794px] rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 print:hidden">
                  {english.error}{" "}
                  <button type="button" onClick={() => switchLang("en")} className="font-semibold underline">
                    Zkusit znovu
                  </button>
                </p>
              )}
              {enActive && englishStale && (
                <p role="status" className="mx-auto mb-4 max-w-[794px] rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">
                  Česká verze se od překladu změnila.{" "}
                  <button
                    type="button"
                    disabled={english.busy}
                    onClick={() => void english.translate(cv, letterState.letter)}
                    className="font-semibold underline"
                  >
                    Přeložit znovu
                  </button>
                </p>
              )}
              {paywall.notice && (
                <p
                  role={paywall.notice.error ? "alert" : "status"}
                  className={`mx-auto mb-4 max-w-[794px] rounded-xl px-4 py-3 text-sm print:hidden ${
                    paywall.notice.error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900"
                  }`}
                >
                  {paywall.notice.text}
                  {paywall.paid && (
                    <button type="button" onClick={downloadPdf} className="ml-2 font-semibold underline">
                      Stáhnout PDF
                    </button>
                  )}
                </p>
              )}
              {kofiUrl && askSupport && (
                <p
                  data-testid="kofi-note"
                  className="bg-brand-soft text-ink mx-auto mb-4 flex max-w-[794px] flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm print:hidden"
                >
                  <span>Pomohlo ti Cvéčko? Podpoř ho drobným příspěvkem.</span>
                  <KofiLink
                    href={kofiUrl}
                    className="rounded-full bg-white px-4 py-2 font-semibold shadow-sm transition hover:shadow"
                  />
                </p>
              )}
              <p className="print-locked-notice hidden">
                Životopis si stáhneš v PDF po zaplacení přes tlačítko „Stáhnout PDF“ na webu Cvéčko.
              </p>
              {paywall.config?.enabled && (
                <PaywallDialog
                  open={paywallOpen}
                  config={paywall.config}
                  reason={paywallReason}
                  onClose={() => setPaywallOpen(false)}
                  onPay={(plan) => paywall.startCheckout({ cv, templateId, accent, letter: letterState.letter, doc }, plan)}
                  onUnlock={paywall.unlock}
                />
              )}
              <LetterDialog
                open={tailorOpen}
                initialJob={jobAd || letterState.job}
                busy={tailor.busy}
                error={tailor.error}
                title="Přizpůsobit inzerátu"
                intro="Vlož text inzerátu. AI jen přeskupí tvůj životopis a upraví shrnutí na danou pozici. Nic nového nepřidá."
                submitLabel="Přizpůsobit životopis"
                busyLabel="Přizpůsobuji…"
                onClose={() => {
                  setTailorOpen(false);
                  tailor.setError(null);
                }}
                onSubmit={(job) => {
                  setJobAd(job);
                  void tailor.run(cv, job).then((result) => {
                    if (!result) return;
                    applyReordered(result.cv, result.remap);
                    setTailorOpen(false);
                    setDoc("cv");
                  });
                }}
              />
              <LetterDialog
                open={letterOpen}
                initialJob={letterState.job || jobAd}
                busy={letterState.busy}
                error={letterState.error}
                onClose={() => {
                  setLetterOpen(false);
                  letterState.setError(null);
                }}
                onSubmit={(job) =>
                  void letterState.generate(cv, job).then((ok) => {
                    setJobAd(job);
                    if (ok) {
                      setLetterOpen(false);
                      setDoc("letter");
                    }
                  })
                }
              />
              {tailor.state && doc === "cv" && !enActive && (
                <TailorPanel
                  state={tailor.state}
                  onRevert={() => {
                    const before = tailor.state?.before;
                    if (before) update(() => before);
                    tailor.clear();
                  }}
                  onLetter={() => withAccess("Motivační dopis", () => setLetterOpen(true))}
                />
              )}
              {letterState.letter && <DocTabs value={doc} onChange={setDoc} />}
              <ZoomControls zoom={zoom} onZoom={setZoom} />
              {!hintDismissed && (
                <p role="note" className="edit-hint bg-ink mx-auto mb-3 w-fit rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg print:hidden">
                  <span aria-hidden>👆 </span>Klikni do textu a přepiš ho
                </p>
              )}
              <div
                onPointerDownCapture={() => setHintDismissed(true)}
                onFocusCapture={() => setHintDismissed(true)}
              >
              <A4Preview
                accent={accent}
                paper={template.paper}
                templateId={template.id}
                watermark={paywall.locked}
                zoom={zoom}
              >
                {doc === "letter" && shownLetter ? (
                  <EditContext value={enActive ? enLetterEditApi : letterEditApi}>
                    <GroundingContext value={enActive ? enLetterUnverified : letterUnverified}>
                      <LetterPage cv={shownCv ?? cv} letter={shownLetter} variant={template.id} />
                    </GroundingContext>
                  </EditContext>
                ) : (
                  <EditContext value={enActive ? enEditApi : editApi}>
                    <GroundingContext value={enActive ? enUnverified : unverified}>
                      <template.Component cv={shownCv ?? cv} lang={enActive ? "en" : "cs"} />
                    </GroundingContext>
                  </EditContext>
                )}
              </A4Preview>
              </div>
              <NextSteps
                steps={[
                  {
                    id: "letter",
                    icon: "✉️",
                    title: "Motivační dopis",
                    text: "Vložíš inzerát a AI napíše dopis jen z údajů v tvém životopise.",
                    action: letterState.letter ? "Napsat nový dopis" : "Napsat motivační dopis",
                    onClick: () => withAccess("Motivační dopis", () => setLetterOpen(true)),
                  },
                  {
                    id: "tailor",
                    icon: "🎯",
                    title: "Přizpůsobit inzerátu",
                    text: "AI přeskupí životopis tak, aby nahoře bylo to, co inzerát chce. Nic nepřidá.",
                    action: tailor.state ? "Přizpůsobit jinému inzerátu" : "Přizpůsobit inzerátu",
                    onClick: () => withAccess("Přizpůsobení inzerátu", () => setTailorOpen(true)),
                  },
                  {
                    id: "english",
                    icon: "🌍",
                    title: "Anglická verze",
                    text: "Přeloží životopis i dopis do angličtiny. Jména a firmy zůstanou, jak jsou.",
                    action: english.busy ? "Překládám…" : enActive ? "Zpět na češtinu" : "Přeložit do angličtiny",
                    busy: english.busy,
                    onClick: () => switchLang(enActive ? "cs" : "en"),
                  },
                ]}
              />
            </>
          ) : (
            <EmptyPreview />
          )}
        </div>
      </section>
      <MobileBar
        view={view}
        onView={setView}
        hasCv={Boolean(cv) || loading}
        primaryLabel={
          loading ? "Vytvářím…" : view === "text" ? "Vytvořit životopis" : paywall.downloading ? "Připravuji PDF…" : "Stáhnout PDF"
        }
        primaryDisabled={loading || paywall.downloading || (view === "preview" && !cv)}
        onPrimary={() => {
          if (view === "text") formRef.current?.requestSubmit();
          else downloadPdf();
        }}
      />
    </div>
  );
}

function formatTime(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
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
