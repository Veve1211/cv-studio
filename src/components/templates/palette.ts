export interface Accent {
  id: string;
  name: string;
  /** Accent colour; dark enough for 4.5:1 contrast on white text-size use. */
  value: string;
  /** Text colour that reads well on top of the accent (used by "Blok"). */
  on: string;
}

export const ACCENTS: Accent[] = [
  { id: "coral", name: "Korálová", value: "#c23d17", on: "#ffffff" },
  { id: "cobalt", name: "Kobaltová", value: "#2448d8", on: "#ffffff" },
  { id: "emerald", name: "Smaragdová", value: "#0b7a5c", on: "#ffffff" },
  { id: "plum", name: "Švestková", value: "#7a2f9e", on: "#ffffff" },
  { id: "mustard", name: "Hořčicová", value: "#9a6700", on: "#ffffff" },
  { id: "graphite", name: "Grafitová", value: "#2b2d33", on: "#ffffff" },
];

export const DEFAULT_ACCENT = ACCENTS[0];

export function getAccent(id: string): Accent {
  return ACCENTS.find((a) => a.id === id) ?? DEFAULT_ACCENT;
}
