"use client";

import { useCallback, useEffect, useState } from "react";
import { isTemplateId } from "@/components/templates";
import { getAccent, type Accent } from "@/components/templates/palette";
import type { TemplateId } from "@/components/templates/types";
import { postJson } from "@/lib/client-api";
import { CvSchema, type Cv } from "@/lib/cv/schema";
import { LetterDocSchema, type LetterDoc } from "@/lib/letter/schema";
import { pdfFileTitle } from "@/lib/pdf";
import type { DocKind } from "./doc-tabs";

const STASH_KEY = "cvecko:checkout";

export interface PaywallConfig {
  enabled: boolean;
  priceCzk: number;
  testMode: boolean;
  /** Presentation mode: everything unlocked in this browser until this time (unix s). */
  demoUntil?: number | null;
}

const FREE: PaywallConfig = { enabled: false, priceCzk: 0, testMode: false, demoUntil: null };

/** ?demo=1 turns presentation mode on (server must have DEMO_ENABLED=1). */
async function activateDemo(): Promise<string | null> {
  const url = new URL(window.location.href);
  if (url.searchParams.get("demo") !== "1") return null;
  url.searchParams.delete("demo");
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  try {
    const res = await fetch("/api/demo", { method: "POST", cache: "no-store" });
    return res.ok ? null : "Prezentační režim není na serveru zapnutý (chybí proměnná DEMO_ENABLED=1).";
  } catch {
    return "Prezentační režim se nepodařilo zapnout. Jsi online?";
  }
}

export interface Snapshot {
  cv: Cv;
  templateId: TemplateId;
  accent: Accent;
  /** Cover letter (kept across the Stripe redirect). */
  letter?: LetterDoc | null;
  /** Which document is shown / downloaded. */
  doc?: DocKind;
}

/**
 * PDF paywall (Stripe Checkout, test mode). Disabled when the server has no key.
 * Stripe is a full-page redirect, so the CV is stashed in sessionStorage of this tab
 * only for the round trip and deleted right after returning. Nothing goes to our server.
 */
export function usePaywall(onRestore: (snapshot: Snapshot) => void) {
  const [config, setConfig] = useState<PaywallConfig | null>(null);
  const [paid, setPaid] = useState(false);
  /** Verified, paid Stripe session (memory only) – the server needs it for every PDF. */
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    activateDemo()
      .then((demoError) => {
        if (demoError && !cancelled) setDemoError(demoError);
        return fetch("/api/checkout", { cache: "no-store" });
      })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PaywallConfig | null) => {
        if (!cancelled) setConfig(data ?? FREE);
      })
      .catch(() => !cancelled && setConfig(FREE));
    return () => {
      cancelled = true;
    };
  }, []);

  // Returning from Stripe: restore the CV and verify the payment.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("checkout");
    if (!result) return;
    const sessionIdParam = params.get("session_id") ?? "";
    window.history.replaceState(null, "", window.location.pathname);

    async function handleReturn() {
      const snapshot = readStash();
      if (snapshot) onRestore(snapshot);
      if (result === "cancel") {
        setNotice({ text: "Platba byla zrušena. Životopis máš pořád tady.", error: false });
        return;
      }
      try {
        const data = await postJson("/api/checkout/verify", { sessionId: sessionIdParam });
        if ((data as { paid?: unknown } | null)?.paid === true) {
          setPaid(true);
          setSessionId(sessionIdParam);
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
        JSON.stringify({
          cv: snapshot.cv,
          templateId: snapshot.templateId,
          accentId: snapshot.accent.id,
          letter: snapshot.letter ?? null,
          doc: snapshot.doc ?? "cv",
        }),
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

  /** Clean PDF rendered on the server after the payment is verified there again. */
  const downloadServerPdf = useCallback(
    async (snapshot: Snapshot) => {
      if (!sessionId) return;
      setDownloading(true);
      try {
        const res = await fetch("/api/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            cv: snapshot.cv,
            templateId: snapshot.templateId,
            accentId: snapshot.accent.id,
            ...(snapshot.doc === "letter" && snapshot.letter ? { letter: snapshot.letter } : {}),
          }),
        });
        if (!res.ok) {
          const data: unknown = await res.json().catch(() => null);
          const message =
            data && typeof data === "object" && "error" in data && typeof data.error === "string"
              ? data.error
              : "PDF se nepodařilo stáhnout. Zkus to prosím znovu.";
          throw new Error(message);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${pdfFileTitle(snapshot.cv.name, snapshot.doc === "letter" ? "Motivacni-dopis" : "Zivotopis")}.pdf`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      } catch (err) {
        setNotice({
          text: err instanceof TypeError ? "Nepodařilo se spojit se serverem. Jsi online?" : (err as Error).message,
          error: true,
        });
      } finally {
        setDownloading(false);
      }
    },
    [sessionId],
  );

  const demoUntil = config?.demoUntil ?? null;
  return { config, demoUntil, demoError, locked, paid, downloading, notice, setNotice, startCheckout, downloadServerPdf };
}

function readStash(): Snapshot | null {
  try {
    const raw = sessionStorage.getItem(STASH_KEY);
    sessionStorage.removeItem(STASH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { cv?: unknown; templateId?: unknown; accentId?: unknown; letter?: unknown; doc?: unknown };
    const cv = CvSchema.safeParse(data.cv);
    if (!cv.success) return null;
    const templateId = typeof data.templateId === "string" && isTemplateId(data.templateId) ? data.templateId : "magazine";
    const letter = LetterDocSchema.safeParse(data.letter);
    return {
      cv: cv.data,
      templateId,
      accent: getAccent(String(data.accentId ?? "")),
      letter: letter.success ? letter.data : null,
      doc: data.doc === "letter" && letter.success ? "letter" : "cv",
    };
  } catch {
    return null;
  }
}
