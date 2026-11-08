import { splitPeriod } from "@/lib/cv/format";
import { Field } from "../field";
import type { TemplateProps } from "../types";
import s from "./timeline.module.css";

const CONTACT_KEYS = ["email", "phone", "location", "web"] as const;

export function Timeline({ cv }: TemplateProps) {
  const hasSide = cv.education.length > 0 || cv.skills.length > 0 || cv.languages.length > 0;
  return (
    <div className={s.root}>
      <header className={s.head}>
        <Field as="h1" className={s.name} path="name" value={cv.name} placeholder="Tvoje jméno" />
        <Field as="p" className={s.headline} path="headline" value={cv.headline} />
        <ul className={s.contact}>
          {CONTACT_KEYS.map((k) => (
            <Field key={k} as="li" path={`contact.${k}`} value={cv.contact[k]} />
          ))}
        </ul>
      </header>

      <Field as="p" className={s.summary} path="summary" value={cv.summary} />

      {cv.experience.length > 0 && (
        <section>
          <h2 className={s.label}>Praxe</h2>
          <ol>
            {cv.experience.map((e, i) => {
              const { start, end } = splitPeriod(e.period);
              return (
                <li key={i} className={s.entry}>
                  <div className={s.year} data-path={`experience.${i}.period`}>
                    <span className={s.yearStart}>{start}</span>
                    {end && <span className={s.yearEnd}>{end}</span>}
                  </div>
                  <div className={s.dot} aria-hidden />
                  <div>
                    <Field as="h3" className={s.role} path={`experience.${i}.role`} value={e.role} />
                    <Field as="p" className={s.company} path={`experience.${i}.company`} value={e.company} />
                    {e.highlights.length > 0 && (
                      <ul className={s.points}>
                        {e.highlights.map((h, j) => (
                          <Field key={j} as="li" path={`experience.${i}.highlights.${j}`} value={h} />
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {hasSide && (
        <div className={s.side}>
          {cv.education.length > 0 && (
            <section>
              <h2 className={s.label}>Vzdělání</h2>
              {cv.education.map((e, i) => (
                <div key={i} className={s.edu}>
                  <Field as="strong" path={`education.${i}.school`} value={e.school} />
                  <Field path={`education.${i}.degree`} value={e.degree} />
                  <Field className={s.muted} path={`education.${i}.period`} value={e.period} />
                </div>
              ))}
            </section>
          )}
          {cv.skills.length > 0 && (
            <section>
              <h2 className={s.label}>Dovednosti</h2>
              <ul className={s.rows}>
                {cv.skills.map((skill, i) => (
                  <Field key={i} as="li" path={`skills.${i}`} value={skill} />
                ))}
              </ul>
            </section>
          )}
          {cv.languages.length > 0 && (
            <section>
              <h2 className={s.label}>Jazyky</h2>
              <ul className={s.rows}>
                {cv.languages.map((l, i) => (
                  <li key={i}>
                    <Field path={`languages.${i}.language`} value={l.language} />
                    <Field className={s.muted} path={`languages.${i}.level`} value={l.level} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
