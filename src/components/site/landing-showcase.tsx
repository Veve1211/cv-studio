"use client";

import { useEffect, useState } from "react";
import { getTemplate } from "@/components/templates";
import { Miniature } from "@/components/templates/miniature";
import { ACCENTS } from "@/components/templates/palette";
import { SHOWCASE_CVS } from "@/lib/cv/sample";

const SHOWCASE = [
  { id: "swiss", accent: ACCENTS[1], tilt: "-rotate-3 translate-y-4", cv: SHOWCASE_CVS[1] },
  { id: "aura", accent: ACCENTS[0], tilt: "z-10 scale-105", cv: SHOWCASE_CVS[0] },
  { id: "bento", accent: ACCENTS[2], tilt: "rotate-3 translate-y-4", cv: SHOWCASE_CVS[2] },
] as const;

/**
 * True after the page load and an idle moment. The miniatures use template fonts the hero
 * doesn't need; loading them up front delayed the first paint on mobile (Lighthouse LCP).
 */
function useAfterLoad() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Safari has no requestIdleCallback.
    const hasIdle = typeof window.requestIdleCallback === "function";
    let idle: number | undefined;
    const done = () => setReady(true);
    const run = () => {
      idle = hasIdle ? requestIdleCallback(done, { timeout: 1500 }) : window.setTimeout(done, 200);
    };
    if (document.readyState === "complete") run();
    else window.addEventListener("load", run, { once: true });
    return () => {
      window.removeEventListener("load", run);
      if (idle === undefined) return;
      if (hasIdle) cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);
  return ready;
}

/** Client component: templates render client-only fields (and functions can't cross the server boundary). */
export function LandingShowcase() {
  const ready = useAfterLoad();
  return (
    <div className="relative flex justify-center gap-3 sm:gap-4" aria-label="Ukázky šablon" role="img">
      {SHOWCASE.map(({ id, accent, tilt, cv }) => {
        const template = getTemplate(id);
        return (
          <div key={id} className={`shrink-0 transition-transform duration-500 ${tilt}`}>
            {/* Two sizes instead of fragile CSS scaling; both are decorative. */}
            <Miniature
              template={template}
              accent={accent}
              cv={cv}
              width={104}
              blank={!ready}
              className="rounded-[3px] shadow-[0_12px_28px_rgba(0,0,0,0.18)] sm:!hidden"
            />
            <Miniature
              template={template}
              accent={accent}
              cv={cv}
              width={184}
              blank={!ready}
              className="!hidden rounded-[4px] shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:!block"
            />
            <p className="text-muted mt-3 text-center text-xs font-medium">{template.name}</p>
          </div>
        );
      })}
    </div>
  );
}
