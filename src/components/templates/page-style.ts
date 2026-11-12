import type { CSSProperties } from "react";
import type { Accent } from "./palette";

/** Inline style that gives a page its paper colour and accent variables. */
export function pageStyle(accent: Accent, paper: string): CSSProperties {
  return { background: paper, "--accent": accent.value, "--on-accent": accent.on } as CSSProperties;
}
