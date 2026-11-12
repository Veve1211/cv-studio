import { contactItems } from "@/lib/cv/format";
import { Field } from "../field";
import { labels } from "../labels";
import type { TemplateProps } from "../types";
import s from "./bento.module.css";

const CONTACT_KEYS = ["email", "phone", "location", "web"] as const;

/** Bento: the CV as tiles of different sizes, like a modern dashboard. */
export function Bento({ cv, lang }: TemplateProps) {
  const L = labels(lang);
  const hasContact = contactItems(cv).length > 0;
  const hasSide = cv.education.length > 0 || cv.skills.length > 0 || cv.languages.length > 0;
  return (
    <div className={s.root}>
      <div className={s.top}>
        <header className={`${s.card} ${s.hero}`}>
          <Field as="h1" className={s.name} path="name" value={cv.name} placeholder="Tvoje jméno" />
          <Field as="p" className={s.headline} path="headline" value={cv.headline} />
        </header>
        {hasContact && (
          <section className={`${s.card} ${s.contactCard}`}>
            <h2 className={s.label}>{L.contact}</h2>
            <ul className={s.contact}>
              {CONTACT_KEYS.map((k) => (
                <Field key={k} as="li" path={`contact.${k}`} value={cv.contact[k]} />
              ))}
            </ul>
          </section>
        )}
      </div>

      {cv.summary && (
        <section className={`${s.card} ${s.summaryCard}`}>
          <h2 className={s.label}>{L.profile}</h2>
          <Field as="p" className={s.summary} path="summary" value={cv.summary} />
        </section>
      )}

      <div className={hasSide ? s.grid : undefined}>
        {cv.experience.length > 0 && (
          <div className={s.col}>
            {cv.experience.map((e, i) => (
              <article key={i} className={`${s.card} ${s.job}`}>
                {i === 0 && <h2 className={s.label}>{L.experience}</h2>}
                <div className={s.jobHead}>
                  <Field as="h3" className={s.role} path={`experience.${i}.role`} value={e.role} />
                  <Field className={s.chip} path={`experience.${i}.period`} value={e.period} />
                </div>
                <Field as="p" className={s.company} path={`experience.${i}.company`} value={e.company} />
                {e.highlights.length > 0 && (
                  <ul className={s.points}>
                    {e.highlights.map((h, j) => (
                      <Field key={j} as="li" path={`experience.${i}.highlights.${j}`} value={h} />
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}

        {hasSide && (
          <div className={s.col}>
            {cv.skills.length > 0 && (
              <section className={s.card}>
                <h2 className={s.label}>{L.skills}</h2>
                <ul className={s.tags}>
                  {cv.skills.map((skill, i) => (
                    <Field key={i} as="li" path={`skills.${i}`} value={skill} />
                  ))}
                </ul>
              </section>
            )}
            {cv.languages.length > 0 && (
              <section className={`${s.card} ${s.accentCard}`}>
                <h2 className={s.label}>{L.languages}</h2>
                <ul className={s.langs}>
                  {cv.languages.map((l, i) => (
                    <li key={i}>
                      <Field path={`languages.${i}.language`} value={l.language} />
                      <Field className={s.level} path={`languages.${i}.level`} value={l.level} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {cv.education.length > 0 && (
              <section className={s.card}>
                <h2 className={s.label}>{L.education}</h2>
                {cv.education.map((e, i) => (
                  <div key={i} className={s.edu}>
                    <Field as="h3" className={s.school} path={`education.${i}.school`} value={e.school} />
                    <Field as="p" path={`education.${i}.degree`} value={e.degree} />
                    <Field as="p" className={s.muted} path={`education.${i}.period`} value={e.period} />
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
