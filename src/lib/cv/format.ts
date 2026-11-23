import type { Cv } from "./schema";

/** Non-empty contact values in display order. */
export function contactItems(cv: Cv): string[] {
  const { email, phone, location, web } = cv.contact;
  return [email, phone, location, web].filter((v) => v.length > 0);
}

/** Splits "2019 – 2022" into start "2019" and end "2022"; tolerates odd formats. */
export function splitPeriod(period: string): { start: string; end: string } {
  const parts = period
    .split(/\s*[–—-]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) return { start: parts[0], end: parts[parts.length - 1] };
  return { start: parts[0] ?? "", end: "" };
}
