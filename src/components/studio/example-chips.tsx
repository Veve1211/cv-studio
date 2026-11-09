"use client";

import { EXAMPLES } from "@/lib/cv/examples";

interface ExampleChipsProps {
  onPick: (text: string) => void;
}

/** Three one-click starting points for people who do not know what to write. */
export function ExampleChips({ onPick }: ExampleChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Vyzkoušej příklad">
      <span className="text-muted text-xs font-medium">Nevíš, jak začít? Vyzkoušej:</span>
      {EXAMPLES.map((example) => (
        <button
          key={example.id}
          type="button"
          onClick={() => onPick(example.text)}
          className="border-line hover:border-brand-strong hover:bg-brand-soft min-h-9 rounded-full border bg-white/80 px-3 text-sm font-medium transition"
        >
          {example.label}
        </button>
      ))}
    </div>
  );
}
