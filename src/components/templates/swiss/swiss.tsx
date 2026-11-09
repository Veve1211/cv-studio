import { splitPeriod } from "@/lib/cv/format";
import { Field } from "../field";
import { labels } from "../labels";
import type { TemplateProps } from "../types";
import s from "./swiss.module.css";

const CONTACT_KEYS = ["email", "phone", "location", "web"] as const;

/** Švýcar: strict grid, numbered sections, giant years, one accent colour. */
export function Swiss({ cv, lang }: TemplateProps) {
  const L = labels(lang);
  let n = 0;
  const num = () => String(++n).padStart(2, "0");
  return (
    <div className={s.root}>
      <header className={s.head}>
        <Field as="h1" className={s.name} path="name" value={cv.name} placeholder="Tvoje jméno" />
        <div className={s.headRow}>
          <Field as="p" className={s.headline} path="headline" value={cv.headline} />
          <ul className={s.contact}>
            {CONTACT_KEYS.map((k) => (
              <Field key={k} as="li" path={`contact.${k}`} value={cv.contact[k]} />
            ))}
          </ul>
        </div>
      </header>

      {cv.summary && (
        <section className={s.row}>
          <h2 className={s.label}>
            <span className={s.num}>{num()}</span>
            {L.profile}
          </h2>
          <Field as="p" className={s.summary} path="summary" value={cv.summary} />
        </section>
      )}

      {cv.experience.length > 0 && (
        <section>
          <h2 className={`${s.label} ${s.labelWide}`}>
            <span className={s.num}>{num()}</span>
            {L.experience}
          </h2>
          {cv.experience.map((e, i) => {
            const { start, end } = splitPeriod(e.period);
            return (
              <article key={i} className={s.entry}>
                <Field
                  as="div"
                  className={s.year}
                  path={`experience.${i}.period`}
                  value={e.period}
                  placeholder=" "
                  render={() => (
                    <>
                      <span className={s.yearStart}>{start}</span>
                      {end && (
                        <>
                          <span className={s.sep}> – </span>
                          <span className={s.yearEnd}>{end}</span>
                        </>
                      )}
                    </>
                  )}
                />
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
              </article>
            );
          })}
        </section>
      )}

      {cv.education.length > 0 && (
        <section>
          <h2 className={`${s.label} ${s.labelWide}`}>
            <span className={s.num}>{num()}</span>
            {L.education}
          </h2>
          {cv.education.map((e, i) => {
            const { start, end } = splitPeriod(e.period);
            return (
              <article key={i} className={s.entry}>
                <Field
                  as="div"
                  className={`${s.year} ${s.yearSmall}`}
                  path={`education.${i}.period`}
                  value={e.period}
                  placeholder=" "
                  render={() => (
                    <>
                      <span className={s.yearStart}>{start}</span>
                      {end && (
                        <>
                          <span className={s.sep}> – </span>
                          <span className={s.yearEnd}>{end}</span>
                        </>
                      )}
                    </>
                  )}
                />
                <div>
                  <Field as="h3" className={s.role} path={`education.${i}.school`} value={e.school} />
                  <Field as="p" className={s.company} path={`education.${i}.degree`} value={e.degree} />
                </div>
              </article>
            );
          })}
        </section>
      )}

      {(cv.skills.length > 0 || cv.languages.length > 0) && (
        <div className={s.bottom}>
          {cv.skills.length > 0 && (
            <section>
              <h2 className={s.label}>
                <span className={s.num}>{num()}</span>
                {L.skills}
              </h2>
              <ul className={s.cols}>
                {cv.skills.map((skill, i) => (
                  <Field key={i} as="li" path={`skills.${i}`} value={skill} />
                ))}
              </ul>
            </section>
          )}
          {cv.languages.length > 0 && (
            <section>
              <h2 className={s.label}>
                <span className={s.num}>{num()}</span>
                {L.languages}
              </h2>
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
        </div>
      )}
    </div>
  );
}
