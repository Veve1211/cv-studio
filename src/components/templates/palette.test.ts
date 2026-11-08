import { describe, expect, it } from "vitest";
import { ACCENTS } from "./palette";

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

describe("accent palette", () => {
  it("has exactly 6 colours with unique ids", () => {
    expect(ACCENTS).toHaveLength(6);
    expect(new Set(ACCENTS.map((a) => a.id)).size).toBe(6);
  });

  it.each(ACCENTS)("$name meets WCAG AA contrast on white and with its text colour", (accent) => {
    expect(contrast(accent.value, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrast(accent.value, accent.on)).toBeGreaterThanOrEqual(4.5);
  });
});
