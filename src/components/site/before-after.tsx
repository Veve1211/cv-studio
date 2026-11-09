"use client";

import { useEffect, useRef, useState } from "react";
import { getTemplate } from "@/components/templates";
import { Miniature } from "@/components/templates/miniature";
import { ACCENTS } from "@/components/templates/palette";
import { SAMPLE_CV } from "@/lib/cv/sample";

/** The messy input that matches the sample CV (fictional person). */
const MESSY = `tereza novakova, brno
tereza.novakova@example.com / 777 123 456

od 2022 delam v kvetouci s.r.o. senior produktova designerka – mobilni appka na objednavky kvetin, testovani s uzivatelama kazdy 2 tydny, knihovna komponent pro 3 tymy
2019-2022 agentura pixel ux/ui – weby a eshopy pro retail, prototypy ve figme
2017-2019 tiskarna brno grafik (katalogy, letaky, podklady pro tisk)

MUNI vizualni komunikace mgr 2012-2017
figma, vyzkum, prototypy, design systemy, html css, workshopy
AJ C1, NJ A2`;

/**
 * Before/after: unpolished text on the left turns into a finished CV on the right
 * when the section scrolls into view (instant with prefers-reduced-motion).
 */
export function BeforeAfter() {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const template = getTemplate("timeline");

  return (
    <section ref={ref} aria-labelledby="before-after-title" className="mx-auto max-w-6xl px-4 pb-20 sm:px-8 print:hidden">
      <div className="mb-8 max-w-2xl">
        <p className="text-brand-strong text-xs font-semibold uppercase tracking-[0.16em]">Před a po</p>
        <h2 id="before-after-title" className="font-display mt-2 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
          Z neučesaných poznámek hotový životopis
        </h2>
        <p className="text-muted mt-3 text-lg leading-relaxed">
          Bez diakritiky, bez struktury, klidně s překlepy. Cvéčko z toho vytáhne praxi, vzdělání a dovednosti – a nic
          nepřidá.
        </p>
      </div>

      <div className="ba-grid grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]" data-shown={shown ? "" : undefined} key={round}>
        <figure className="glass rounded-[1.75rem] p-5">
          <figcaption className="text-muted mb-3 text-xs font-semibold uppercase tracking-[0.14em]">Před</figcaption>
          <pre className="before-text text-ink-soft max-h-[340px] overflow-hidden whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed">
            {MESSY}
          </pre>
        </figure>

        <div aria-hidden="true" className="ba-arrow mx-auto grid size-12 place-items-center rounded-full bg-white text-xl shadow-md lg:rotate-0">
          <span className="lg:hidden">↓</span>
          <span className="hidden lg:inline">→</span>
        </div>

        <figure className="glass ba-after flex flex-col items-center rounded-[1.75rem] p-5">
          <figcaption className="text-muted mb-3 self-start text-xs font-semibold uppercase tracking-[0.14em]">Po</figcaption>
          <Miniature
            template={template}
            accent={ACCENTS[0]}
            cv={SAMPLE_CV}
            width={260}
            className="rounded-[4px] shadow-[0_18px_40px_rgba(10,60,120,0.18)]"
          />
        </figure>
      </div>
      <button
        type="button"
        onClick={() => setRound((r) => r + 1)}
        className="text-brand-strong mt-4 text-sm font-semibold underline underline-offset-4"
      >
        Přehrát znovu
      </button>
    </section>
  );
}
