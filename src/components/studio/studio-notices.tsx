"use client";

import { KofiLink } from "@/components/site/kofi-link";
import { formatDate, formatTime } from "./format";
import type { useEnglish } from "./use-english";
import type { usePaywall } from "./use-paywall";

type Paywall = ReturnType<typeof usePaywall>;

/** Above the text form: presentation mode, full access, a picked plan, demo errors. */
export function StudioBadges({
  paywall,
  pickedPlan,
  hasCv,
}: {
  paywall: Paywall;
  pickedPlan: "trial" | "14d" | "year" | null;
  hasCv: boolean;
}) {
  return (
    <>
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
      {pickedPlan && paywall.config?.enabled && !hasCv && (
        <p role="status" data-testid="plan-hint" className="bg-brand-soft text-ink mb-4 rounded-2xl px-4 py-3 text-sm">
          {paywall.config.access
            ? `Už máš plný přístup do ${formatDate(paywall.config.access.until)}. Vytvoř si životopis a stáhni PDF.`
            : "Nejdřív si vytvoř životopis. Zaplatíš až při stažení PDF, tarif máš předvybraný."}
        </p>
      )}
      {paywall.demoError && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {paywall.demoError}
        </p>
      )}
    </>
  );
}

/** Above the A4 preview: translation state, payment notice, support note, print notice. */
export function PreviewNotices({
  english,
  enActive,
  englishStale,
  onTranslateAgain,
  onRetryEnglish,
  paywall,
  onDownload,
  kofiUrl,
  askSupport,
}: {
  english: Pick<ReturnType<typeof useEnglish>, "busy" | "error">;
  enActive: boolean;
  englishStale: boolean;
  onTranslateAgain: () => void;
  onRetryEnglish: () => void;
  paywall: Pick<Paywall, "notice" | "paid">;
  onDownload: () => void;
  kofiUrl: string | null;
  askSupport: boolean;
}) {
  return (
    <>
      {english.busy && (
        <p role="status" className="text-muted mx-auto mb-4 max-w-[794px] text-sm print:hidden">
          Překládám do angličtiny…
        </p>
      )}
      {english.error && (
        <p role="alert" className="mx-auto mb-4 max-w-[794px] rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 print:hidden">
          {english.error}{" "}
          <button type="button" onClick={onRetryEnglish} className="font-semibold underline">
            Zkusit znovu
          </button>
        </p>
      )}
      {enActive && englishStale && (
        <p role="status" className="mx-auto mb-4 max-w-[794px] rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">
          Česká verze se od překladu změnila.{" "}
          <button type="button" disabled={english.busy} onClick={onTranslateAgain} className="font-semibold underline">
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
            <button type="button" onClick={onDownload} className="ml-2 font-semibold underline">
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
          <KofiLink href={kofiUrl} className="rounded-full bg-white px-4 py-2 font-semibold shadow-sm transition hover:shadow" />
        </p>
      )}
      <p className="print-locked-notice hidden">
        Životopis si stáhneš v PDF po zaplacení přes tlačítko „Stáhnout PDF“ na webu Cvéčko.
      </p>
    </>
  );
}
