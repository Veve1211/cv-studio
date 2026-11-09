"use client";

import type { ElementType, KeyboardEvent, ReactNode } from "react";
import { czechTypo, plainText } from "@/lib/cv/typography";
import { UNVERIFIED_MESSAGE } from "@/lib/cv/grounding";
import { useEdit } from "./edit-context";
import { useUnverified } from "./grounding-context";

interface FieldProps {
  as?: ElementType;
  className?: string;
  /** Path of the value inside the CV, e.g. "experience.0.role". Used for editing. */
  path: string;
  value: string;
  /** Text shown (and editable) when the value is empty; omit to hide empty fields. */
  placeholder?: string;
  /** Custom display (e.g. a split period); its textContent must equal the value. */
  render?: (display: string) => ReactNode;
}

/**
 * Renders one CV text value. React escapes it, so user/AI text never becomes HTML.
 * Inside an EditContext the element is contentEditable (plain text only) and the
 * new text is committed on blur or Enter.
 */
export function Field({ as: Tag = "span", className, path, value, placeholder, render }: FieldProps) {
  const edit = useEdit();
  const unverified = useUnverified(path);
  if (!value && !placeholder) return null;
  const display = czechTypo(value || placeholder || "");
  const content = render ? render(display) : display;

  const warn = unverified
    ? {
        "data-unverified": "",
        "data-warn": UNVERIFIED_MESSAGE,
        "aria-description": `${UNVERIFIED_MESSAGE}: ${unverified.join(", ")}`,
      }
    : {};
  const classes = `${className ?? ""}${unverified ? " cv-unverified" : ""}`;

  if (!edit) {
    return (
      <Tag className={classes || undefined} data-path={path} {...warn}>
        {content}
      </Tag>
    );
  }

  const commit = (el: HTMLElement) => {
    const next = plainText(el.textContent ?? "");
    if (next !== value) edit.onEdit(path, next);
  };

  return (
    <Tag
      // Remount after each change so React never fights the browser's edited DOM.
      key={value}
      className={`${classes} cv-editable`}
      data-path={path}
      {...warn}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck
      title={unverified ? `${UNVERIFIED_MESSAGE}: ${unverified.join(", ")}` : "Klikni a přepiš"}
      onBlur={(e: React.FocusEvent<HTMLElement>) => commit(e.currentTarget)}
      onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          e.currentTarget.textContent = display;
          e.currentTarget.blur();
        }
      }}
    >
      {content}
    </Tag>
  );
}
