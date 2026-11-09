"use client";

import { useCallback, useRef, useState, type DragEvent, type ReactNode } from "react";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const UNSUPPORTED = "Tenhle soubor neumíme přečíst. Nahraj prosím PDF nebo Word (DOCX) do 5 MB.";

export interface UploadResult {
  text: string;
  fileName: string;
  truncated: boolean;
}

/** Quick client-side check before uploading (the server checks the real content again). */
export function precheckFile(file: { name: string; size: number }): string | null {
  if (!/\.(pdf|docx)$/i.test(file.name)) {
    return /\.doc$/i.test(file.name)
      ? "Starý formát .doc neumíme. Ulož prosím dokument jako .docx nebo PDF."
      : UNSUPPORTED;
  }
  if (file.size > MAX_BYTES) return "Soubor je větší než 5 MB.";
  if (file.size === 0) return "Soubor je prázdný.";
  return null;
}

export function useFileUpload(onText: (result: UploadResult) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      const problem = precheckFile(file);
      if (problem) {
        setError(problem);
        return;
      }
      setBusy(true);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/extract", { method: "POST", body });
        const data: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          const message =
            data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : UNSUPPORTED;
          throw new Error(message);
        }
        const { text, truncated } = data as { text?: unknown; truncated?: unknown };
        if (typeof text !== "string") throw new Error("Soubor se nepodařilo přečíst. Zkus to prosím znovu.");
        onText({ text, fileName: file.name, truncated: truncated === true });
      } catch (err) {
        setError(err instanceof TypeError ? "Nepodařilo se spojit se serverem. Jsi online?" : (err as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [onText],
  );

  return { busy, error, setError, upload };
}

export function UploadButton({ busy, onFile }: { busy: boolean; onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-testid="file-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="text-brand-strong hover:bg-brand-soft inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60"
      >
        <span aria-hidden>📄</span>
        {busy ? "Čtu soubor…" : "Nahrát PDF nebo Word"}
      </button>
    </>
  );
}

/** Makes the whole area a drop target with a clear overlay while dragging. */
export function DropArea({
  children,
  onFile,
  className,
}: {
  children: ReactNode;
  onFile: (file: File) => void;
  className?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

  return (
    <section
      className={`relative ${className ?? ""}`}
      aria-labelledby="studio-title"
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        if (!hasFiles(e)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragging(false);
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
      }}
    >
      {children}
      {dragging && (
        <div
          data-testid="drop-overlay"
          className="border-brand-strong bg-brand-soft/90 pointer-events-none absolute inset-2 z-30 grid place-items-center rounded-3xl border-2 border-dashed text-center backdrop-blur-sm"
        >
          <div>
            <p className="font-display text-2xl font-bold">Pusť soubor sem</p>
            <p className="text-muted mt-1 text-sm">PDF nebo Word (DOCX), max 5 MB</p>
          </div>
        </div>
      )}
    </section>
  );
}
