import { Minimal } from "./minimal/minimal";
import type { TemplateDef, TemplateId } from "./types";

export const TEMPLATES: TemplateDef[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Hodně bílého místa, dovednosti jako štítky",
    Component: Minimal,
    paper: "#ffffff",
  },
];

export const DEFAULT_TEMPLATE: TemplateId = "minimal";

export function getTemplate(id: TemplateId): TemplateDef {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
