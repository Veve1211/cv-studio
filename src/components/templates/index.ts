import { Aura } from "./aura/aura";
import { Bento } from "./bento/bento";
import { Block } from "./block/block";
import { Magazine } from "./magazine/magazine";
import { Minimal } from "./minimal/minimal";
import { Swiss } from "./swiss/swiss";
import { Terminal } from "./terminal/terminal";
import { Timeline } from "./timeline/timeline";
import type { TemplateDef, TemplateId } from "./types";

export const TEMPLATES: TemplateDef[] = [
  {
    id: "aura",
    name: "Aura",
    description: "Jemná světelná záře v hlavičce, velké jméno, hodně vzduchu",
    Component: Aura,
    paper: "#ffffff",
  },
  {
    id: "swiss",
    name: "Švýcar",
    description: "Přísná mřížka, číslované sekce a obří roky v jedné barvě",
    Component: Swiss,
    paper: "#ffffff",
  },
  {
    id: "bento",
    name: "Bento",
    description: "Obsah v kartách různých velikostí jako moderní dashboard",
    Component: Bento,
    paper: "#ffffff",
  },
  {
    id: "magazine",
    name: "Časopis",
    description: "Velké jméno přes celou šířku, patkové písmo, text ve sloupcích",
    Component: Magazine,
    paper: "#fbf8f2",
  },
  {
    id: "timeline",
    name: "Časová osa",
    description: "Praxe jako svislá linka s roky",
    Component: Timeline,
    paper: "#ffffff",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Hodně bílého místa, dovednosti jako štítky",
    Component: Minimal,
    paper: "#ffffff",
  },
  {
    id: "block",
    name: "Blok",
    description: "Barevné plochy a velká typografie",
    Component: Block,
    paper: "#ffffff",
  },
  {
    id: "terminal",
    name: "Terminál",
    description: "Pro IT: neproporcionální písmo, decentní",
    Component: Terminal,
    paper: "#fdfdfb",
  },
];

export const DEFAULT_TEMPLATE: TemplateId = "aura";

export function getTemplate(id: TemplateId): TemplateDef {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function isTemplateId(value: string): value is TemplateId {
  return TEMPLATES.some((t) => t.id === value);
}
