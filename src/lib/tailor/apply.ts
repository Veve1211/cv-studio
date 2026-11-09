import { fold } from "@/lib/cv/grounding";
import type { Cv } from "@/lib/cv/schema";
import type { Tailor } from "./schema";

/**
 * A safe permutation of 0..length-1: valid, unique indices in the AI's order, then any
 * the AI forgot in their original order. Nothing can be dropped or duplicated.
 */
export function safeOrder(order: readonly number[], length: number): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const i of order) {
    if (Number.isInteger(i) && i >= 0 && i < length && !seen.has(i)) {
      seen.add(i);
      out.push(i);
    }
  }
  for (let i = 0; i < length; i++) if (!seen.has(i)) out.push(i);
  return out;
}

export interface TailorResult {
  cv: Cv;
  /** Maps an old field path (e.g. "experience.2.role") to its new path. */
  remap: (path: string) => string;
  analysis: { wants: string[]; have: string[]; missing: string[] };
}

/** Applies only reordering + the new summary. Every other value stays exactly as it was. */
export function applyTailor(cv: Cv, t: Tailor): TailorResult {
  const expOrder = safeOrder(t.experienceOrder, cv.experience.length);
  const skillOrder = safeOrder(t.skillsOrder, cv.skills.length);
  const hlOrders = cv.experience.map((e, i) => safeOrder(t.highlightOrder[i] ?? [], e.highlights.length));

  const next: Cv = {
    ...cv,
    summary: t.summary.trim() || cv.summary,
    experience: expOrder.map((i) => ({
      ...cv.experience[i],
      highlights: hlOrders[i].map((j) => cv.experience[i].highlights[j]),
    })),
    skills: skillOrder.map((i) => cv.skills[i]),
  };

  const newExp = new Map(expOrder.map((oldI, newI) => [oldI, newI]));
  const newSkill = new Map(skillOrder.map((oldI, newI) => [oldI, newI]));
  const newHl = hlOrders.map((order) => new Map(order.map((oldJ, newJ) => [oldJ, newJ])));
  const remap = (path: string): string => {
    const hl = path.match(/^experience\.(\d+)\.highlights\.(\d+)$/);
    if (hl) {
      const [i, j] = [Number(hl[1]), Number(hl[2])];
      return `experience.${newExp.get(i) ?? i}.highlights.${newHl[i]?.get(j) ?? j}`;
    }
    const exp = path.match(/^experience\.(\d+)\.(.+)$/);
    if (exp) return `experience.${newExp.get(Number(exp[1])) ?? exp[1]}.${exp[2]}`;
    const skill = path.match(/^skills\.(\d+)$/);
    if (skill) return `skills.${newSkill.get(Number(skill[1])) ?? skill[1]}`;
    return path;
  };

  // "Máš" only when the quoted evidence really is in the CV (checked in code, not by AI).
  const haystack = fold(JSON.stringify(cv));
  const have: string[] = [];
  const missing: string[] = [];
  for (const r of t.requirements) {
    const evidence = fold(r.evidence).trim();
    if (evidence.length >= 2 && haystack.includes(evidence)) have.push(r.text);
    else missing.push(r.text);
  }
  return { cv: next, remap, analysis: { wants: t.requirements.map((r) => r.text), have, missing } };
}
