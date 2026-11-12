"use client";

import { pdfFileTitle } from "@/lib/pdf";

interface DownloadPdfButtonProps {
  onClick: () => void;
  busy?: boolean;
}

/** Without a paywall it prints the preview; with one the studio decides (dialog / server PDF). */
export function DownloadPdfButton({ onClick, busy = false }: DownloadPdfButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      // On phones the same action lives in the bottom bar (thumb reach).
      className="btn-primary rounded-full px-5 py-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-70 max-lg:hidden"
    >
      {busy ? "Připravuji PDF…" : "Stáhnout PDF"}
    </button>
  );
}

/**
 * Prints the A4 preview. The browser's "Save as PDF" produces exactly the preview,
 * with no browser margins (@page margin 0). The document title becomes the file name.
 */
export function printCv(name: string, prefix?: string) {
  // Commit an edit that is still in progress.
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  const previous = document.title;
  document.title = pdfFileTitle(name, prefix);
  const restore = () => {
    document.title = previous;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}
