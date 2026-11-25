"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { A4Preview } from "@/components/preview/a4-preview";
import { DEFAULT_TEMPLATE, getTemplate } from "@/components/templates";
import type { TemplateId } from "@/components/templates/types";
import { EXAMPLES } from "@/lib/cv/examples";
import { SAMPLE_CV } from "@/lib/cv/sample";
import { MIN_INPUT_CHARS } from "@/lib/cv/schema";
import { DEFAULT_ACCENT } from "@/components/templates/palette";
import { AccentPicker } from "./accent-picker";
import { DropArea, useFileUpload, type UploadResult } from "./file-upload";
import { LoadingPage } from "./loading-page";
import { MobileBar, ZoomControls, type MobileView } from "./mobile-bar";
import { TemplatePicker } from "./template-picker";
import { EditContext } from "@/components/templates/edit-context";
import { GroundingContext } from "@/components/templates/grounding-context";
import { LetterPage } from "@/components/letter/letter-page";
import { DocTabs, type DocKind } from "./doc-tabs";
import { LetterDialog } from "./letter-dialog";
import { useLetter } from "./use-letter";
import { DownloadPdfButton, printCv } from "./download-pdf-button";
import { PaywallDialog } from "./paywall-dialog";
import { usePaywall } from "./use-paywall";
import { NextSteps } from "./next-steps";
import { track } from "@/lib/track";
import { PreviewToolbar } from "./preview-toolbar";
import { useGenerate } from "./use-generate";
import { TailorPanel } from "./tailor-panel";
import { LangSwitch } from "./lang-switch";
import { useEnglish } from "./use-english";
import type { CvLang } from "@/components/templates/labels";
import { useTailor } from "./use-tailor";
import { CvTextForm } from "./cv-text-form";
import { EmptyPreview } from "./empty-preview";
import { formatDate } from "./format";
import { PreviewNotices, StudioBadges } from "./studio-notices";
import { useUnverified } from "./use-unverified";

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
  /** Plan clicked in the landing page pricing (?tarif=), preselected at the PDF download. */
  const [pickedPlan, setPickedPlan] = useState<"trial" | "14d" | "year" | null>(null);
  useEffect(() => {
    const url = new URL(window.location.href);
    const tarif = url.searchParams.get("tarif");
    if (tarif !== "14d" && tarif !== "year") return;
    url.searchParams.delete("tarif");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    // Deferred so the state update is not synchronous inside the effect.
    queueMicrotask(() => setPickedPlan(tarif));
  }, []);

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
  const letterEditApi = useMemo(() => ({ onEdit: letterState.editText }), [letterState.editText]);
  const previewRef = useRef<HTMLHeadingElement>(null);

  // English version: both languages stay in memory, switching never calls the AI again.
  const en = english.state;
  const enActive = lang === "en" && en !== null;
  const shownCv = enActive ? en.cv : cv;
  const shownLetter = enActive ? en.letter : letterState.letter;
  const englishStale = en !== null && (en.fromCv !== cv || en.fromLetter !== letterState.letter);
  // Facts the AI wrote that are not in the user's text (code check, never AI).
  const { unverified, letterUnverified, enUnverified, enLetterUnverified } = useUnverified({
    cv,
    source,
    confirmed,
    letter: letterState,
    english,
  });
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

  /**
   * A plan clicked in the landing page pricing. Handled in place (no reload), so an
   * already created CV is kept: CV + no access → payment dialog with the plan picked,
   * full access → "Už máš plný přístup", no CV yet → hint to create it first.
   */
  function onPricingClick(plan: "trial" | "14d" | "year") {
    setPickedPlan(plan);
    const config = paywall.config;
    if (cv && config?.enabled && config.access) {
      paywall.setNotice({ text: `Už máš plný přístup do ${formatDate(config.access.until)}.`, error: false });
      setView("preview");
    } else if (cv && config?.enabled) {
      setPaywallReason("");
      setPaywallOpen(true);
      return;
    } else if (!cv) {
      setView("text");
    }
    document.getElementById("studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const pricingClickRef = useRef(onPricingClick);
  useEffect(() => {
    pricingClickRef.current = onPricingClick;
  });
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest?.("a[data-plan]");
      const plan = link?.getAttribute("data-plan");
      if (plan !== "trial" && plan !== "14d" && plan !== "year") return;
      event.preventDefault();
      pricingClickRef.current(plan);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  /** No paywall: browser print. Paywall: dialog first, then a clean PDF from the server. */
  function downloadPdf() {
    if (!cv) return;
    if (!paywall.config?.enabled) {
      track("PDF stažení");
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
    track("PDF stažení");
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
        <StudioBadges paywall={paywall} pickedPlan={pickedPlan} hasCv={Boolean(cv)} />
        <h2 id="studio-title" className="font-display text-3xl font-bold tracking-[-0.03em]">
          Tvůj životopis
        </h2>
        <p className="text-muted mt-2 text-[15px] leading-relaxed">
          Žádný formulář. Vlož cokoliv: starý životopis, text z LinkedInu nebo jen odrážky.
        </p>

        <CvTextForm
          formRef={formRef}
          textareaRef={textareaRef}
          text={text}
          onTextChange={(value) => {
            setText(value);
            if (localError) setLocalError(null);
            if (uploadNote) setUploadNote(null);
            if (replacedText !== null) setReplacedText(null);
          }}
          onExample={(example) => {
            if (text.trim() && text !== example && !EXAMPLE_TEXTS.has(text)) setReplacedText(text);
            setText(example);
            setLocalError(null);
            setUploadNote(null);
          }}
          replacedText={replacedText}
          onRestoreText={() => {
            if (replacedText !== null) setText(replacedText);
            setReplacedText(null);
          }}
          error={shownError}
          canRetry={!localError}
          upload={{ busy: fileUpload.busy, error: fileUpload.error, onFile: (file) => void fileUpload.upload(file) }}
          uploadNote={uploadNote}
          loading={loading}
          onSubmit={onSubmit}
          onSample={() => {
            setLocalError(null);
            loadSample(SAMPLE_CV);
            letterState.restore(null);
            tailor.clear();
            resetEnglish();
            setDoc("cv");
            setView("preview");
          }}
        />
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
              <PreviewNotices
                english={english}
                enActive={enActive}
                englishStale={englishStale}
                onTranslateAgain={() => void english.translate(cv, letterState.letter)}
                onRetryEnglish={() => switchLang("en")}
                paywall={paywall}
                onDownload={downloadPdf}
                kofiUrl={kofiUrl}
                askSupport={askSupport}
              />
              {paywall.config?.enabled && (
                <PaywallDialog
                  open={paywallOpen}
                  config={paywall.config}
                  reason={paywallReason}
                  initialPlan={pickedPlan === "14d" || pickedPlan === "year" ? pickedPlan : undefined}
                  highlightTrial={pickedPlan === "trial"}
                  onClose={() => setPaywallOpen(false)}
                  onPay={(plan) => paywall.startCheckout({ cv, templateId, accent, letter: letterState.letter, doc }, plan)}
                  onUnlock={async (kind, code) => {
                    await paywall.unlock(kind, code);
                    // Unlocked from "Stáhnout PDF": continue with the download right away.
                    if (paywallReason === "PDF bez vodoznaku") {
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
                  }}
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
                  tailor.cancel();
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
                  letterState.cancel();
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
