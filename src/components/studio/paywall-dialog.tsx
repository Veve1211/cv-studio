"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PaywallConfig } from "./use-paywall";

interface PaywallDialogProps {
  open: boolean;
  config: PaywallConfig;
  /** What the user tried to do, e.g. "Stáhnout PDF bez vodoznaku". */
  reason: string;
  /** Plan picked on the landing page pricing, preselected here. */
  initialPlan?: "14d" | "year";
  onClose: () => void;
  onPay: (plan: "14d" | "year") => Promise<void>;
  onUnlock: (kind: "trial" | "code", code?: string) => Promise<void>;
}

/** Full access: one free day, 14 days or a year (one-off, no subscription), or "Mám kód". */
export function PaywallDialog({ open, config, reason, initialPlan, onClose, onPay, onUnlock }: PaywallDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [plan, setPlan] = useState<"14d" | "year">("year");
  const [terms, setTerms] = useState(false);
  const [startNow, setStartNow] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const codeId = useId();
  const consentHintId = useId();
  const missingConsent = !terms || !startNow;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open && initialPlan) setPlan(initialPlan);
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open, initialPlan]);

  const paidPlans = config.plans.filter((p) => p.id !== "trial");
  const trial = config.plans.find((p) => p.id === "trial");
  const chosen = paidPlans.find((p) => p.id === plan);

  async function run(action: () => Promise<void>, keepBusy = false) {
    setBusy(true);
    setError(null);
    try {
      await action();
      if (!keepBusy) {
        setBusy(false);
        onClose();
      }
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className="m-auto max-h-[92dvh] w-[min(94vw,520px)] overflow-y-auto rounded-3xl p-0 shadow-2xl backdrop:bg-[rgb(11_27_51/0.45)] print:hidden"
    >
      <div className="flex flex-col gap-4 p-6 sm:p-7">
        <div>
          <h2 id={titleId} className="font-display text-2xl font-bold tracking-tight">
            Odemkni plný přístup
          </h2>
          <p className="text-muted mt-1.5 text-[15px] leading-relaxed">
            {reason} je součástí plného přístupu. Náhled a úpravy máš dál zdarma.
          </p>
        </div>

        {trial && !config.trialUsed && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(() => onUnlock("trial"))}
            className="border-brand-strong bg-brand-soft min-h-12 rounded-2xl border-2 px-4 text-left font-semibold transition disabled:opacity-60"
          >
            🎁 Vyzkoušet 1 den zdarma
            <span className="text-muted block text-sm font-normal">Bez karty, jednou na prohlížeč.</span>
          </button>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold">Nebo jednorázově, bez automatického obnovení</legend>
          {paidPlans.map((p) => (
            <label
              key={p.id}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-2 transition ${
                plan === p.id ? "border-brand-strong bg-white shadow-sm" : "border-line"
              }`}
            >
              <input
                type="radio"
                name="plan"
                value={p.id}
                checked={plan === p.id}
                onChange={() => setPlan(p.id as "14d" | "year")}
                className="accent-[var(--color-brand-strong)]"
              />
              <span className="flex-1 font-semibold">
                {p.name}
                {p.id === "year" && (
                  <span className="bg-brand-strong ml-2 rounded-full px-2 py-0.5 text-xs text-white">Nejvýhodnější</span>
                )}
              </span>
              <span className="font-display text-lg font-bold">{p.priceCzk} Kč</span>
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-2 text-sm">
          <label className="flex cursor-pointer gap-2.5">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 size-4" />
            <span>
              Souhlasím s{" "}
              <a href="/obchodni-podminky" target="_blank" rel="noopener" className="underline underline-offset-2">
                obchodními podmínkami
              </a>
              .
            </span>
          </label>
          <label className="flex cursor-pointer gap-2.5">
            <input type="checkbox" checked={startNow} onChange={(e) => setStartNow(e.target.checked)} className="mt-0.5 size-4" />
            <span>Souhlasím, aby přístup začal hned po zaplacení (před uplynutím lhůty pro odstoupení).</span>
          </label>
        </div>

        {config.testMode && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Testovací režim: nic se nestrhne. Použij kartu <strong>4242 4242 4242 4242</strong>, libovolné budoucí
            datum a CVC.
          </p>
        )}
        <p className="text-muted text-xs leading-relaxed">
          Kvůli přesměrování na platební bránu si životopis dočasně uložíme jen v tomto okně prohlížeče. Po návratu ho
          hned smažeme. Na náš server se neukládá.
        </p>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void run(() => onPay(plan), true)}
            disabled={busy || missingConsent || !chosen}
            aria-describedby={missingConsent ? consentHintId : undefined}
            className="btn-primary min-h-11 flex-1 rounded-full px-6 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Chvilku…" : chosen ? `Zaplatit ${chosen.priceCzk} Kč` : "Zaplatit"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border-line hover:border-brand-strong min-h-11 rounded-full border px-5 font-medium transition"
          >
            Zrušit
          </button>
        </div>
        {missingConsent && (
          <p id={consentHintId} className="text-muted -mt-2 text-sm">
            Pro pokračování zaškrtni oba souhlasy.
          </p>
        )}

        <details className="border-line border-t pt-3">
          <summary className="cursor-pointer text-sm font-semibold">Mám kód</summary>
          <form
            className="mt-2 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) void run(() => onUnlock("code", code.trim()));
            }}
          >
            <label htmlFor={codeId} className="sr-only">
              Přístupový kód
            </label>
            <input
              id={codeId}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="CV-XXXXXX-XXXXXXXX"
              autoComplete="off"
              spellCheck={false}
              className="border-line focus:border-brand-strong min-h-11 flex-1 rounded-full border px-4 font-mono text-sm uppercase outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="border-line hover:border-brand-strong min-h-11 rounded-full border px-4 text-sm font-semibold"
            >
              Použít kód
            </button>
          </form>
        </details>
      </div>
    </dialog>
  );
}
