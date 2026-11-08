"use client";

import { useCallback, useEffect, useState } from "react";
import { isTemplateId } from "@/components/templates";
import { getAccent, type Accent } from "@/components/templates/palette";
import type { TemplateId } from "@/components/templates/types";
import { postJson } from "@/lib/client-api";
import { CvSchema, type Cv } from "@/lib/cv/schema";

const STASH_KEY = "cvecko:checkout";

export interface PaywallConfig {
  enabled: boolean;
  priceCzk: number;
  testMode: boolean;
}

export interface Snapshot {
  cv: Cv;
  templateId: TemplateId;
  accent: Accent;
}

/**
 * PDF paywall (Stripe Checkout, test mode). Disabled when the server has no key.
 * Stripe is a full-page redirect, so the CV is stashed in sessionStorage of this tab
 * only for the round trip and deleted right after returning. Nothing goes to our server.
 */
export function usePaywall(onRestore: (snapshot: Snapshot) => void) {
  const [config, setConfig] = useState<PaywallConfig | null>(null);
  const [paid, setPaid] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/checkout", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PaywallConfig | null) => {
        if (!cancelled) setConfig(data ?? { enabled: false, priceCzk: 0, testMode: false });
      })
      .catch(() => !cancelled && setConfig({ enabled: false, priceCzk: 0, testMode: false }));
    return () => {
      cancelled = true;
    };
  }, []);

  // Returning from Stripe: restore the CV and verify the payment.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("checkout");
    if (!result) return;
    const sessionId = params.get("session_id") ?? "";
    window.history.replaceState(null, "", window.location.pathname);

    async function handleReturn() {
      const snapshot = readStash();
      if (snapshot) onRestore(snapshot);
      if (result === "cancel") {
        setNotice({ text: "Platba byla zrušena. Životopis máš pořád tady.", error: false });
        return;
      }
      try {
        const data = await postJson("/api/checkout/verify", { sessionId });
        if ((data as { paid?: unknown } | null)?.paid === true) {
          setPaid(true);
          setNotice({ text: "Zaplaceno, děkujeme! Teď si můžeš stáhnout PDF.", error: false });
        } else {
          setNotice({ text: "Platbu se nepodařilo ověřit. Pokud ti byly strženy peníze, napiš nám.", error: true });
        }
      } catch (err) {
        setNotice({ text: (err as Error).message, error: true });
      }
    }
    void handleReturn();
    // Runs once on mount; onRestore is stable enough for this one-off.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locked = Boolean(config?.enabled) && !paid;

  // Ctrl+P must not bypass the paywall: print CSS hides the CV while locked.
  useEffect(() => {
    if (locked) document.documentElement.dataset.paywall = "locked";
    else delete document.documentElement.dataset.paywall;
  }, [locked]);

  const startCheckout = useCallback(async (snapshot: Snapshot) => {
    try {
      sessionStorage.setItem(
        STASH_KEY,
        JSON.stringify({ cv: snapshot.cv, templateId: snapshot.templateId, accentId: snapshot.accent.id }),
      );
    } catch {
      // Private mode / storage full: the user would lose the CV after the redirect.
      throw new Error("Prohlížeč nedovolil dočasně uložit životopis. Zkus to prosím mimo anonymní režim.");
    }
    const data = await postJson("/api/checkout", {});
    const url = (data as { url?: unknown } | null)?.url;
    if (typeof url !== "string" || !/^https?:\/\//.test(url)) {
      sessionStorage.removeItem(STASH_KEY);
      throw new Error("Platbu se nepodařilo spustit. Zkus to prosím znovu.");
    }
    window.location.assign(url);
  }, []);

  return { config, locked, paid, notice, setNotice, startCheckout };
}

function readStash(): Snapshot | null {
  try {
    const raw = sessionStorage.getItem(STASH_KEY);
    sessionStorage.removeItem(STASH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { cv?: unknown; templateId?: unknown; accentId?: unknown };
    const cv = CvSchema.safeParse(data.cv);
    if (!cv.success) return null;
    const templateId = typeof data.templateId === "string" && isTemplateId(data.templateId) ? data.templateId : "magazine";
    return { cv: cv.data, templateId, accent: getAccent(String(data.accentId ?? "")) };
  } catch {
    return null;
  }
}
