"use client";

import { ACCENTS, type Accent } from "@/components/templates/palette";

interface AccentPickerProps {
  value: Accent;
  onChange: (accent: Accent) => void;
}

export function AccentPicker({ value, onChange }: AccentPickerProps) {
  return (
    <fieldset>
      <legend className="text-muted mb-2 text-xs font-semibold uppercase tracking-[0.14em]">Barva</legend>
      <div className="flex flex-wrap gap-2">
        {ACCENTS.map((a) => {
          const checked = a.id === value.id;
          return (
            <label key={a.id} className="relative grid size-9 cursor-pointer place-items-center" title={a.name}>
              <input
                type="radio"
                name="accent"
                value={a.id}
                checked={checked}
                onChange={() => onChange(a)}
                className="peer sr-only"
              />
              <span className="sr-only">{a.name}</span>
              <span
                aria-hidden
                className={`peer-focus-visible:outline-ink size-7 rounded-full transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${
                  checked ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[var(--color-ink)]" : ""
                }`}
                style={{ background: a.value }}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
