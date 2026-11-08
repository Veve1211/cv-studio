"use client";

import { createContext, useContext } from "react";

export interface EditApi {
  onEdit: (path: string, value: string) => void;
}

/** Present only around the main preview; thumbnails and print stay read-only. */
export const EditContext = createContext<EditApi | null>(null);

export function useEdit(): EditApi | null {
  return useContext(EditContext);
}
