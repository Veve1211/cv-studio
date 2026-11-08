"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import pageStyles from "@/components/templates/page.module.css";
import type { Accent } from "@/components/templates/palette";

interface A4PreviewProps {
  children: ReactNode;
  accent: Accent;
  paper: string;
  templateId: string;
}

export function pageStyle(accent: Accent, paper: string): CSSProperties {
  return { background: paper, "--accent": accent.value, "--on-accent": accent.on } as CSSProperties;
}

/**
 * Renders a real 210 × 297 mm page and scales it down to fit the available width,
 * so the preview is exactly what gets printed to PDF.
 */
export function A4Preview({ children, accent, paper, templateId }: A4PreviewProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLElement>(null);
  const [box, setBox] = useState({ scale: 1, width: 0, height: 0 });

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const page = pageRef.current;
    if (!outer || !page) return;
    const update = () => {
      const pageWidth = page.offsetWidth;
      const scale = Math.min(1, outer.clientWidth / pageWidth);
      setBox({ scale, width: pageWidth * scale, height: page.offsetHeight * scale });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(page);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outerRef} className="cv-preview-outer w-full">
      {/* Paint the paper colour into the printed page margins too (only hex values from our registry). */}
      {/^#[0-9a-f]{6}$/i.test(paper) && <style>{`@page { background: ${paper}; }`}</style>}
      <div
        className="cv-preview-frame relative mx-auto"
        style={{ width: box.width || undefined, height: box.height || undefined }}
      >
        <article
          ref={pageRef}
          id="cv-page"
          data-template={templateId}
          aria-label="Náhled životopisu"
          className={`${pageStyles.page} cv-page absolute left-0 top-0 origin-top-left shadow-[0_2px_6px_rgba(0,0,0,0.06),0_24px_60px_rgba(0,0,0,0.12)]`}
          style={{ transform: `scale(${box.scale})`, ...pageStyle(accent, paper) }}
        >
          {children}
        </article>
      </div>
    </div>
  );
}
