import Script from "next/script";

/**
 * Cookie-less analytics (Plausible or Umami). Nothing loads unless ANALYTICS_URL is set,
 * e.g. ANALYTICS_URL=https://plausible.io/js/script.js + ANALYTICS_ID=cvecko.cz
 * or   ANALYTICS_URL=https://cloud.umami.is/script.js + ANALYTICS_ID=<website id>.
 */
export function Analytics() {
  const src = analyticsScript();
  if (!src) return null;
  const id = process.env.ANALYTICS_ID?.trim() ?? "";
  const attrs = /umami/i.test(src) ? { "data-website-id": id } : { "data-domain": id || undefined };
  return <Script src={src} strategy="afterInteractive" {...attrs} />;
}

/** Only absolute https URLs are accepted. */
export function analyticsScript(): string | null {
  const raw = process.env.ANALYTICS_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
