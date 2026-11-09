/** "Tereza Nováková" -> "Zivotopis-Tereza-Novakova" (safe, ASCII file name). */
export function pdfFileTitle(name: string, prefix = "Zivotopis"): string {
  const ascii = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return ascii ? `${prefix}-${ascii}` : prefix;
}
