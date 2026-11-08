import type { Cv } from "@/lib/cv/schema";

export type TemplateId = "magazine" | "timeline" | "minimal" | "block" | "terminal";

export interface TemplateProps {
  cv: Cv;
}

export interface TemplateDef {
  id: TemplateId;
  name: string;
  description: string;
  Component: (props: TemplateProps) => React.ReactNode;
  /** Page background, used for the thumbnail and print. */
  paper: string;
}
