/**
 * Funnel events for the cookie-less analytics (Plausible or Umami, see `Analytics`).
 * Only fixed event names are sent – never text, CV data or anything typed by the user.
 * Without ANALYTICS_URL no script is loaded and this does nothing.
 */
export type TrackEvent = "CV vytvořeno" | "PDF stažení";

type AnalyticsWindow = {
  plausible?: (event: string) => void;
  umami?: { track: (event: string) => void };
};

export function track(event: TrackEvent): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as AnalyticsWindow;
  try {
    if (typeof w.plausible === "function") w.plausible(event);
    else if (typeof w.umami?.track === "function") w.umami.track(event);
  } catch {
    // Analytics must never break the app (blocked script, ad blocker, …).
  }
}
