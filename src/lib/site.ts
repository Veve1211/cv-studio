export const SITE_NAME = "Cvéčko";
export const SITE_TAGLINE = "Bez formulářů. Vlož text, máš životopis.";
export const SITE_TITLE = "Cvéčko – životopis z pár vět";
export const SITE_DESCRIPTION =
  "Napiš o sobě pár vět nebo nahraj starý životopis. AI z toho poskládá moderní životopis v češtině – bez formulářů, nic si nevymýšlí. Náhled zdarma.";

/** Public origin for absolute URLs (sitemap, Open Graph). Set APP_URL in production. */
export function siteUrl(): string {
  const raw = process.env.APP_URL?.trim().replace(/\/$/, "");
  return raw && /^https?:\/\/[^/\s]+$/.test(raw) ? raw : "http://localhost:3000";
}

/**
 * Ko-fi page for tips (KOFI_URL, read at runtime). Only a plain https link: no Ko-fi
 * scripts are ever loaded (CSP). Without the variable nothing is shown.
 */
export function kofiUrl(): string | null {
  const raw = process.env.KOFI_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}
