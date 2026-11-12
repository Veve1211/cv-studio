import type { Cv } from "@/lib/cv/schema";
import pageStyles from "./page.module.css";
import { pageStyle } from "./page-style";
import type { Accent } from "./palette";
import type { TemplateDef } from "./types";

const PAGE_WIDTH_PX = 793.7; // 210 mm
const PAGE_HEIGHT_PX = 1122.5; // 297 mm

interface MiniatureProps {
  template: TemplateDef;
  accent: Accent;
  cv: Cv;
  /** Rendered width in CSS px. */
  width: number;
  className?: string;
}

/** A real template page scaled down; decorative, hidden from assistive tech. */
export function Miniature({ template, accent, cv, width, className = "" }: MiniatureProps) {
  const scale = width / PAGE_WIDTH_PX;
  return (
    <span
      aria-hidden
      className={`relative block overflow-hidden ${className}`}
      style={{ width, height: Math.round(PAGE_HEIGHT_PX * scale) }}
    >
      <span
        className={`${pageStyles.page} pointer-events-none absolute left-0 top-0 block origin-top-left select-none`}
        style={{ transform: `scale(${scale})`, ...pageStyle(accent, template.paper) }}
      >
        <template.Component cv={cv} />
      </span>
    </span>
  );
}
