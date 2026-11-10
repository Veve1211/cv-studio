/**
 * A job ad copied from a whole web page (jobs.cz and the like) carries menus, cookie
 * banners and footers. They only slow the AI down and can confuse it, so obvious
 * website clutter is dropped before sending. Anything that might be part of the ad stays.
 */
export const JOB_TEXT_LIMIT = 8_000;

/** Whole lines that are website navigation or footer, never part of an ad. */
const CLUTTER_LINE: RegExp[] = [
  /©|\(c\)\s*\d{4}|copyright/i,
  /všechna práva vyhrazena|all rights reserved/i,
  /^přejít na\b|^skip to\b/i,
  /^zpětná vazba$|^feedback$/i,
  /cookies?/i,
  /^(domů|úvod|menu|hledat|vyhledat|přihlásit( se)?|odhlásit( se)?|registrace|registrovat|můj účet|nabídky práce|pro firmy|pro zaměstnavatele|kariérní rady|kontakt(y)?|o nás|blog|nápověda|mapa stránek|ochrana osobních údajů|zásady ochrany osobních údajů|podmínky užívání|obchodní podmínky|sdílet|uložit|uložit inzerát|vytisknout|tisk|nahlásit( inzerát)?|zpět|zpět na výsledky|další nabídky|podobné nabídky|sledujte nás|stáhněte si aplikaci|facebook|instagram|linkedin|x|twitter|youtube|tiktok)$/i,
];

export function cleanJobText(text: string): string {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const kept = lines.filter((raw) => {
    const line = raw.trim().replace(/\s+/g, " ");
    if (!line) return true;
    // Long sentences are content even if they mention e.g. cookies or Instagram.
    if (line.length > 80) return true;
    return !CLUTTER_LINE.some((re) => re.test(line));
  });
  return kept
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Cleaned and capped text, plus whether anything was removed or cut. */
export function prepareJobText(text: string): { text: string; cleaned: boolean; truncated: boolean } {
  const cleanedText = cleanJobText(text);
  const truncated = cleanedText.length > JOB_TEXT_LIMIT;
  return {
    text: truncated ? cleanedText.slice(0, JOB_TEXT_LIMIT).trimEnd() : cleanedText,
    cleaned: cleanedText.length < text.trim().length,
    truncated,
  };
}
