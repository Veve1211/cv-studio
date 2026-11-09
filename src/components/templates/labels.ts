/** Language of the CV document (section headings are translated by the template). */
export type CvLang = "cs" | "en";

export const LABELS = {
  cs: {
    cv: "Životopis",
    profile: "Profil",
    experience: "Praxe",
    education: "Vzdělání",
    skills: "Dovednosti",
    languages: "Jazyky",
    contact: "Kontakt",
  },
  en: {
    cv: "Curriculum vitae",
    profile: "Profile",
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    contact: "Contact",
  },
} as const;

export function labels(lang: CvLang = "cs") {
  return LABELS[lang];
}
