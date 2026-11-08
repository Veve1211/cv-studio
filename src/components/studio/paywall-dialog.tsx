"use client";

import { useEffect, useRef, useState } from "react";
import type { PaywallConfig } from "./use-paywall";

interface PaywallDialogProps {
  open: boolean;
  config: PaywallConfig;
  onClose: () => void;
  onPay: () => Promise<void>;
}

export function PaywallDialog({ open, config, onClose, onPay }: PaywallDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      await onPay();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="paywall-title"
      className="m-auto w-[min(92vw,440px)] rounded-3xl p-0 shadow-2xl backdrop:bg-black/40 print:hidden"
    >
      <div className="p-7">
        <h2 id="paywall-title" className="font-display text-2xl font-semibold tracking-tight">
          Stáhnout PDF za {config.priceCzk} Kč
        </h2>
        <p className="text-muted mt-3 leading-relaxed">
          Náhled a úpravy máš zdarma. Za PDF zaplatíš jednorázově {config.priceCzk} Kč kartou přes Stripe.
        </p>
        {config.testMode && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Testovací režim: nic se nestrhne. Použij kartu <strong>4242 4242 4242 4242</strong>, libovolné budoucí
            datum a CVC.
          </p>
        )}
        <p className="text-muted mt-3 text-xs leading-relaxed">
          Kvůli přesměrování na platební bránu si životopis dočasně uložíme jen v tomto okně prohlížeče. Po návratu ho
          hned smažeme. Na náš server se neukládá.
        </p>
        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={pay}
            disabled={busy}
            className="bg-ink hover:bg-ink/90 flex-1 rounded-full px-6 py-3 font-semibold text-white transition disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Přesměrovávám…" : `Zaplatit ${config.priceCzk} Kč`}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border-line hover:border-ink rounded-full border px-5 py-3 font-medium transition"
          >
            Zrušit
          </button>
        </div>
      </div>
    </dialog>
  );
}
