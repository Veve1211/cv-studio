import { Field } from "@/components/templates/field";
import type { TemplateId } from "@/components/templates/types";
import { contactItems } from "@/lib/cv/format";
import type { Cv } from "@/lib/cv/schema";
import type { LetterDoc } from "@/lib/letter/schema";
import s from "./letter.module.css";

interface LetterPageProps {
  cv: Cv;
  letter: LetterDoc;
  variant: TemplateId;
}

/** Cover letter in the look of the chosen CV template. Letter fields are editable. */
export function LetterPage({ cv, letter, variant }: LetterPageProps) {
  return (
    <div className={`${s.root} ${s[variant] ?? ""}`} data-letter>
      <header className={s.head}>
        <h1 className={s.name}>{cv.name || "Tvoje jméno"}</h1>
        {cv.headline && <p className={s.headline}>{cv.headline}</p>}
        {contactItems(cv).length > 0 && (
          <ul className={s.contact}>
            {contactItems(cv).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
      </header>

      <div className={s.meta}>
        <Field as="p" className={s.recipient} path="recipient" value={letter.recipient} />
        <Field as="p" className={s.date} path="dateLine" value={letter.dateLine} />
      </div>

      <Field as="p" className={s.greeting} path="greeting" value={letter.greeting} />
      <div className={s.body}>
        {letter.paragraphs.map((p, i) => (
          <Field key={i} as="p" path={`paragraphs.${i}`} value={p} />
        ))}
      </div>

      <div className={s.sign}>
        <Field as="p" path="closing" value={letter.closing} />
        <p className={s.signName}>{cv.name}</p>
      </div>
    </div>
  );
}
