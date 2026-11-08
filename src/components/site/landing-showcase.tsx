"use client";

import { getTemplate } from "@/components/templates";
import { Miniature } from "@/components/templates/miniature";
import { ACCENTS } from "@/components/templates/palette";
import { SAMPLE_CV } from "@/lib/cv/sample";

const SHOWCASE = [
  { id: "magazine", accent: ACCENTS[0], tilt: "-rotate-3 translate-y-4" },
  { id: "block", accent: ACCENTS[1], tilt: "z-10 scale-105" },
  { id: "timeline", accent: ACCENTS[2], tilt: "rotate-3 translate-y-4" },
] as const;

/** Client component: templates render client-only fields (and functions can't cross the server boundary). */
export function LandingShowcase() {
  return (
    <div className="relative flex justify-center gap-3 sm:gap-4" aria-label="Ukázky šablon" role="img">
      {SHOWCASE.map(({ id, accent, tilt }) => {
        const template = getTemplate(id);
        return (
          <div key={id} className={`shrink-0 transition-transform duration-500 ${tilt}`}>
            {/* Two sizes instead of fragile CSS scaling; both are decorative. */}
            <Miniature
              template={template}
              accent={accent}
              cv={SAMPLE_CV}
              width={104}
              className="rounded-[3px] shadow-[0_12px_28px_rgba(0,0,0,0.18)] sm:!hidden"
            />
            <Miniature
              template={template}
              accent={accent}
              cv={SAMPLE_CV}
              width={184}
              className="!hidden rounded-[4px] shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:!block"
            />
            <p className="text-muted mt-3 text-center text-xs font-medium">{template.name}</p>
          </div>
        );
      })}
    </div>
  );
}
