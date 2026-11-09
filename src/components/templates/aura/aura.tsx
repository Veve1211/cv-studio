import { Field } from "../field";
import { labels } from "../labels";
import type { TemplateProps } from "../types";
import s from "./aura.module.css";

const CONTACT_KEYS = ["email", "phone", "location", "web"] as const;

/** Aura: a soft light glow behind a large name, lots of air, one calm column. */
export function Aura({ cv, lang }: TemplateProps) {
  const L = labels(lang);
  return (
    <div className={s.root}>
      <header className={s.head}>
        <div className={s.glow} aria-hidden />
        <Field as="h1" className={s.name} path="name" value={cv.name} placeholder="Tvoje jméno" />
        <Field as="p" className={s.headline} path="headline" value={cv.headline} />
        <ul className={s.contact}>
          {CONTACT_KEYS.map((k) => (
            <Field key={k} as="li" path={`contact.${k}`} value={cv.contact[k]} />
          ))}
        </ul>
      </header>

      <div className={s.body}>
        {cv.summary && (
          <section className={s.row}>
            <h2 className={s.label}>{L.profile}</h2>
            <Field as="p" className={s.summary} path="summary" value={cv.summary} />
          </section>
        )}

        {cv.experience.length > 0 && (
          <section className={s.row}>
            <h2 className={s.label}>{L.experience}</h2>
            <div>
              {cv.experience.map((e, i) => (
                <article key={i} className={s.item}>
                  <div className={s.itemHead}>
                    <Field as="h3" className={s.role} path={`experience.${i}.role`} value={e.role} />
                    <Field className={s.period} path={`experience.${i}.period`} value={e.period} />
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
          </section>
        )}

        {cv.education.length > 0 && (
          <section className={s.row}>
            <h2 className={s.label}>{L.education}</h2>
            <div>
              {cv.education.map((e, i) => (
                <article key={i} className={s.item}>
                  <div className={s.itemHead}>
                    <Field as="h3" className={s.role} path={`education.${i}.school`} value={e.school} />
                    <Field className={s.period} path={`education.${i}.period`} value={e.period} />
                  </div>
                  <Field as="p" className={s.company} path={`education.${i}.degree`} value={e.degree} />
                </article>
              ))}
            </div>
          </section>
        )}

        {cv.skills.length > 0 && (
          <section className={s.row}>
            <h2 className={s.label}>{L.skills}</h2>
            <ul className={s.pills}>
              {cv.skills.map((skill, i) => (
                <Field key={i} as="li" path={`skills.${i}`} value={skill} />
              ))}
            </ul>
          </section>
        )}

        {cv.languages.length > 0 && (
          <section className={s.row}>
            <h2 className={s.label}>{L.languages}</h2>
            <ul className={s.langs}>
              {cv.languages.map((l, i) => (
                <li key={i}>
                  <Field className={s.langName} path={`languages.${i}.language`} value={l.language} />
                  <Field className={s.muted} path={`languages.${i}.level`} value={l.level} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
