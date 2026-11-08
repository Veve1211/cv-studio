/**
 * Czech typography for display: no line break after one-letter prepositions
 * and conjunctions (v, k, s, z, o, u, a, i), e.g. "v Brně" stays together.
 * Lookbehind lets consecutive ones ("a v Praze") all bind.
 */
const ONE_LETTER = /(?<=^|[\s(„"])([vkszouaiVKSZOUAI]) (?=\S)/g;

export function czechTypo(text: string): string {
  return text.replace(ONE_LETTER, "$1 ");
}

/** Undo display-only typography (used when reading edited text back). */
export function plainText(text: string): string {
  return text.replace(/ /g, " ").replace(/\s+/g, " ").trim();
}
