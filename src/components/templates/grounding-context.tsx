"use client";

import { createContext, useContext } from "react";

/** path → words that were not found in the user's text (only in the main preview). */
export const GroundingContext = createContext<ReadonlyMap<string, string[]> | null>(null);

export function useUnverified(path: string): string[] | undefined {
  return useContext(GroundingContext)?.get(path);
}
