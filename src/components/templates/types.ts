import type { Cv } from "@/lib/cv/schema";
import type { CvLang } from "./labels";

export type TemplateId = "aura" | "swiss" | "bento" | "magazine" | "timeline" | "minimal" | "block" | "terminal";

export interface TemplateProps {
  cv: Cv;
  /** Language of section headings (default Czech). */
  lang?: CvLang;
}

export interface TemplateDef {
  id: TemplateId;
  name: string;
  description: string;
  Component: (props: TemplateProps) => React.ReactNode;
  /** Page background, used for the thumbnail and print. */
  paper: string;
}
