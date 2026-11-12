import { contactItems } from "@/lib/cv/format";
import { Field } from "../field";
import { labels } from "../labels";
import type { TemplateProps } from "../types";
import s from "./magazine.module.css";

const CONTACT_KEYS = ["email", "phone", "location", "web"] as const;

export function Magazine({ cv, lang }: TemplateProps) {
  const L = labels(lang);
  return (
    <div className={s.root}>
      <header>
        <div className={s.topline}>
          <span>{L.cv}</span>
          <Field path="headline" value={cv.headline} />
        </div>
        <Field as="h1" className={s.name} path="name" value={cv.name} placeholder="Tvoje jméno" />
        {contactItems(cv).length > 0 && (
          <ul className={s.contact}>
            {CONTACT_KEYS.map((k) => (
              <Field key={k} as="li" path={`contact.${k}`} value={cv.contact[k]} />
            ))}
          </ul>
        )}
      </header>

      <Field as="p" className={s.lead} path="summary" value={cv.summary} />

      <div className={s.columns}>
        {cv.experience.length > 0 && (
          <section className={s.section}>
            <h2 className={s.kicker}>{L.experience}</h2>
            {cv.experience.map((e, i) => (
              <article key={i} className={s.item}>
                <Field as="h3" className={s.role} path={`experience.${i}.role`} value={e.role} />
                <p className={s.meta}>
                  <Field path={`experience.${i}.company`} value={e.company} />
                  {e.company && e.period && " · "}
                  <Field path={`experience.${i}.period`} value={e.period} />
                </p>
                {e.highlights.length > 0 && (
                  <ul className={s.list}>
                    {e.highlights.map((h, j) => (
                      <Field key={j} as="li" path={`experience.${i}.highlights.${j}`} value={h} />
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </section>
        )}

        {cv.education.length > 0 && (
          <section className={s.section}>
            <h2 className={s.kicker}>{L.education}</h2>
            {cv.education.map((e, i) => (
              <article key={i} className={s.item}>
                <Field as="h3" className={s.role} path={e.degree ? `education.${i}.degree` : `education.${i}.school`} value={e.degree || e.school} />
                <p className={s.meta}>
                  {e.degree && <Field path={`education.${i}.school`} value={e.school} />}
                  {e.degree && e.school && e.period && " · "}
                  <Field path={`education.${i}.period`} value={e.period} />
                </p>
              </article>
            ))}
          </section>
        )}

        {cv.skills.length > 0 && (
          <section className={s.section}>
            <h2 className={s.kicker}>{L.skills}</h2>
            <ul className={s.inline}>
              {cv.skills.map((skill, i) => (
                <Field key={i} as="li" path={`skills.${i}`} value={skill} />
              ))}
            </ul>
          </section>
        )}

        {cv.languages.length > 0 && (
          <section className={s.section}>
            <h2 className={s.kicker}>{L.languages}</h2>
            <ul className={s.inline}>
              {cv.languages.map((l, i) => (
                <li key={i}>
                  <Field path={`languages.${i}.language`} value={l.language} />
                  {l.level && " ("}
                  <Field path={`languages.${i}.level`} value={l.level} />
                  {l.level && ")"}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
