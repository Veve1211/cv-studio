import type { ElementType } from "react";

interface FieldProps {
  as?: ElementType;
  className?: string;
  /** Path of the value inside the CV, e.g. "experience.0.role". Used for editing. */
  path: string;
  value: string;
  /** Text shown (and editable) when the value is empty; omit to hide empty fields. */
  placeholder?: string;
}

/** Renders one CV text value. React escapes it, so user/AI text never becomes HTML. */
export function Field({ as: Tag = "span", className, path, value, placeholder }: FieldProps) {
  if (!value && !placeholder) return null;
  return (
    <Tag className={className} data-path={path}>
      {value || placeholder}
    </Tag>
  );
}
