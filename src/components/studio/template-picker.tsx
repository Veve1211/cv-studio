"use client";

import { TEMPLATES } from "@/components/templates";
import pageStyles from "@/components/templates/page.module.css";
import type { Accent } from "@/components/templates/palette";
import type { TemplateId } from "@/components/templates/types";
import { pageStyle } from "@/components/preview/a4-preview";
import { SAMPLE_CV } from "@/lib/cv/sample";
import type { Cv } from "@/lib/cv/schema";

const THUMB_SCALE = 0.135; // 210mm ≈ 794px → ~107px wide

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
                checked ? "bg-white shadow-[0_0_0_2px_var(--color-ink)]" : "hover:bg-white/60"
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
              <span
                aria-hidden
                className="peer-focus-visible:outline-ink relative block h-[147px] w-[107px] overflow-hidden rounded-[3px] shadow-[0_1px_4px_rgba(0,0,0,0.15)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
              >
                <span
                  className={`${pageStyles.page} pointer-events-none absolute left-0 top-0 block origin-top-left`}
                  style={{ transform: `scale(${THUMB_SCALE})`, ...pageStyle(accent, t.paper) }}
                >
                  <t.Component cv={cv ?? SAMPLE_CV} />
                </span>
              </span>
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
