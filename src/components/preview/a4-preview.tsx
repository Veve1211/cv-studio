"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import pageStyles from "@/components/templates/page.module.css";
import { pageStyle } from "@/components/templates/page-style";
import type { Accent } from "@/components/templates/palette";

interface A4PreviewProps {
  children: ReactNode;
  accent: Accent;
  paper: string;
  templateId: string;
  /** Unpaid preview: show a "Náhled" watermark (the clean PDF only comes from the server). */
  watermark?: boolean;
  /** 1 = fit the width; > 1 zooms in and the preview scrolls inside its own box. */
  zoom?: number;
}

/**
 * Renders a real 210 × 297 mm page and scales it down to fit the available width,
 * so the preview is exactly what gets printed to PDF.
 */
export function A4Preview({
  children,
  accent,
  paper,
  templateId,
  watermark = false,
  zoom = 1,
}: A4PreviewProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLElement>(null);
  const [box, setBox] = useState({ scale: 1, width: 0, height: 0 });
  const zoomRef = useRef(zoom);
  const updateRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const page = pageRef.current;
    if (!outer || !page) return;
    const update = () => {
      const pageWidth = page.offsetWidth;
      const scale = Math.min(1, outer.clientWidth / pageWidth) * zoomRef.current;
      setBox({ scale, width: pageWidth * scale, height: page.offsetHeight * scale });
    };
    updateRef.current = update;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(page);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    zoomRef.current = zoom;
    updateRef.current?.();
  }, [zoom]);

  return (
    <div
      ref={outerRef}
      data-testid="preview-scroller"
      className={`cv-preview-outer w-full ${zoom > 1 ? "overflow-x-auto overscroll-x-contain pb-2" : ""}`}
    >
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
          data-watermark={watermark ? "" : undefined}
          className={`${pageStyles.page} cv-page${watermark ? " cv-watermark" : ""} absolute left-0 top-0 origin-top-left shadow-[0_2px_6px_rgba(0,0,0,0.06),0_24px_60px_rgba(0,0,0,0.12)]`}
          style={{ transform: `scale(${box.scale})`, ...pageStyle(accent, paper) }}
        >
          {children}
        </article>
      </div>
    </div>
  );
}
