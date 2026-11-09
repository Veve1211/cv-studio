"use client";

import { pdfFileTitle } from "@/lib/pdf";

interface DownloadPdfButtonProps {
  name: string;
  /** Runs before printing; return false to cancel (used by the paywall). */
  beforePrint?: () => boolean | Promise<boolean>;
}

/**
 * Prints the A4 preview. The browser's "Save as PDF" produces exactly the preview,
 * with no browser margins (@page margin 0). The document title becomes the file name.
 */
export function DownloadPdfButton({ name, beforePrint }: DownloadPdfButtonProps) {
  async function onClick() {
    if (beforePrint && !(await beforePrint())) return;
    printCv(name);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-primary rounded-full px-5 py-2 text-sm font-semibold transition"
    >
      Stáhnout PDF
    </button>
  );
}

export function printCv(name: string) {
  // Commit an edit that is still in progress.
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  const previous = document.title;
  document.title = pdfFileTitle(name);
  const restore = () => {
    document.title = previous;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}
