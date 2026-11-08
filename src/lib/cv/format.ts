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

/** Only the four-digit year if present ("03/2019" -> "2019"), else the original. */
export function yearOf(value: string): string {
  return value.match(/\d{4}/)?.[0] ?? value;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** True when the CV has nothing worth rendering yet. */
export function isEmptyCv(cv: Cv): boolean {
  return (
    !cv.name &&
    !cv.summary &&
    cv.experience.length === 0 &&
    cv.education.length === 0 &&
    cv.skills.length === 0
  );
}
