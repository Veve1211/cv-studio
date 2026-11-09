"use client";

export type DocKind = "cv" | "letter";

/** Switch between the CV and the cover letter (both share template and colour). */
export function DocTabs({ value, onChange }: { value: DocKind; onChange: (doc: DocKind) => void }) {
  return (
    <div role="tablist" aria-label="Dokument" className="bg-brand-soft mx-auto mb-4 flex w-fit rounded-full p-1 print:hidden">
      {(
        [
          ["cv", "Životopis"],
          ["letter", "Motivační dopis"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
            value === id ? "text-ink bg-white shadow-sm" : "text-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
