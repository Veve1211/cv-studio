/**
 * Build guard: with payments on (STRIPE_SECRET_KEY) the terms and complaints pages
 * are public, so no "[DOPLNIT]" placeholder (IČO, address, …) may be left in them.
 * Called from next.config.ts in the production build phase. No path aliases here:
 * next.config.ts imports this file directly.
 */
export const LEGAL_PAGES = ["src/app/obchodni-podminky/page.tsx", "src/app/reklamace/page.tsx"] as const;

/** Placeholder names left in a page source: `<Fill what="…" />` or a literal "[DOPLNIT…". */
export function findPlaceholders(source: string): string[] {
  const found = [...source.matchAll(/<Fill\s+what=["{]`?["']?([^"'`}]+)/g)].map((m) => m[1].trim());
  if (/\[DOPLNIT/.test(source.replace(/<Fill\b[^>]*>/g, ""))) found.push("[DOPLNIT]");
  return found;
}

export function checkLegalPages(
  env: Record<string, string | undefined>,
  read: (path: string) => string,
): string[] {
  if (!env.STRIPE_SECRET_KEY?.trim()) return [];
  return LEGAL_PAGES.flatMap((page) => findPlaceholders(read(page)).map((what) => `${page}: ${what}`));
}

/** Throws (fails the build) when payments are on and a legal page still has placeholders. */
export function assertLegalPagesComplete(env: Record<string, string | undefined>, read: (path: string) => string) {
  const missing = checkLegalPages(env, read);
  if (missing.length) {
    throw new Error(
      `STRIPE_SECRET_KEY is set, but the terms/complaints pages still have placeholders. Fill them in before enabling payments:\n- ${missing.join("\n- ")}`,
    );
  }
}
