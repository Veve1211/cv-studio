"use client";

import type { CvLang } from "@/components/templates/labels";

/** CZ / EN switch for the finished CV and letter. */
export function LangSwitch({ value, onChange, busy }: { value: CvLang; onChange: (lang: CvLang) => void; busy?: boolean }) {
  return (
    <div role="group" aria-label="Jazyk dokumentu" className="bg-brand-soft flex rounded-full p-1">
      {(
        [
          ["cs", "CZ", "česky"],
          ["en", "EN", "anglicky"],
        ] as const
      ).map(([id, short, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          disabled={busy}
          onClick={() => onChange(id)}
          className={`min-h-9 min-w-11 rounded-full px-3 text-sm font-semibold transition disabled:cursor-wait ${
            value === id ? "text-ink bg-white shadow-sm" : "text-muted"
          }`}
        >
          {short}
          <span className="sr-only"> ({label})</span>
        </button>
      ))}
    </div>
  );
}
