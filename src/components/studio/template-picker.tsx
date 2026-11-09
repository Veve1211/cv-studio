"use client";

import { TEMPLATES } from "@/components/templates";
import { Miniature } from "@/components/templates/miniature";
import type { Accent } from "@/components/templates/palette";
import type { TemplateId } from "@/components/templates/types";
import { SAMPLE_CV } from "@/lib/cv/sample";
import type { Cv } from "@/lib/cv/schema";

interface TemplatePickerProps {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
  accent: Accent;
  cv: Cv | null;
}

/** Native radio inputs (arrow keys work) with live miniature previews. */
export function TemplatePicker({ value, onChange, accent, cv }: TemplatePickerProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-muted mb-2 text-xs font-semibold uppercase tracking-[0.14em]">Šablona</legend>
      <div className="relative -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {TEMPLATES.map((t) => {
          const checked = t.id === value;
          return (
            <label
              key={t.id}
              className={`group relative flex w-[118px] shrink-0 cursor-pointer flex-col gap-1.5 rounded-xl p-1.5 transition ${
                checked ? "bg-white shadow-[0_0_0_2px_var(--color-brand-strong)]" : "hover:bg-white/60"
              }`}
            >
              <input
                type="radio"
                name="template"
                value={t.id}
                checked={checked}
                onChange={() => onChange(t.id)}
                className="peer sr-only"
                aria-label={t.name}
                aria-describedby={`tpl-desc-${t.id}`}
              />
              <Miniature
                template={t}
                accent={accent}
                cv={cv ?? SAMPLE_CV}
                width={107}
                className="peer-focus-visible:outline-ink rounded-[3px] shadow-[0_1px_4px_rgba(0,0,0,0.15)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
              />
              <span className="px-0.5 text-[13px] font-semibold leading-tight">{t.name}</span>
              <span id={`tpl-desc-${t.id}`} className="sr-only">
                {t.description}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
