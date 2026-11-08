"use client";

import type { ElementType, KeyboardEvent, ReactNode } from "react";
import { czechTypo, plainText } from "@/lib/cv/typography";
import { useEdit } from "./edit-context";

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
  if (!value && !placeholder) return null;
  const display = czechTypo(value || placeholder || "");
  const content = render ? render(display) : display;

  if (!edit) {
    return (
      <Tag className={className} data-path={path}>
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
      className={`${className ?? ""} cv-editable`}
      data-path={path}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck
      title="Klikni a přepiš"
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
