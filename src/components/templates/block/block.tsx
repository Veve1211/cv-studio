import { Field } from "../field";
import type { TemplateProps } from "../types";
import s from "./block.module.css";

const CONTACT_KEYS = ["email", "phone", "location", "web"] as const;

function Title({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className={s.sectionTitle}>
      <span className={s.num}>{String(n).padStart(2, "0")}</span>
      {children}
    </h2>
  );
}

export function Block({ cv }: TemplateProps) {
  let n = 0;
  const hasFoot = cv.skills.length > 0 || cv.languages.length > 0;
  return (
    <div className={s.root}>
      <header className={s.hero}>
        <Field as="h1" className={s.name} path="name" value={cv.name} placeholder="Tvoje jméno" />
        <Field as="p" className={s.headline} path="headline" value={cv.headline} />
        <ul className={s.contact}>
          {CONTACT_KEYS.map((k) => (
            <Field key={k} as="li" path={`contact.${k}`} value={cv.contact[k]} />
          ))}
        </ul>
      </header>

      {cv.summary && (
        <div className={s.summaryBand}>
          <Field as="p" className={s.summary} path="summary" value={cv.summary} />
        </div>
      )}

      <div className={s.body}>
        {cv.experience.length > 0 && (
          <section className={s.section}>
            <Title n={++n}>Praxe</Title>
            <div>
              {cv.experience.map((e, i) => (
                <article key={i} className={s.job}>
                  <Field as="h3" className={s.role} path={`experience.${i}.role`} value={e.role} />
                  <Field as="p" className={s.period} path={`experience.${i}.period`} value={e.period} />
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
          <section className={s.section}>
            <Title n={++n}>Vzdělání</Title>
            <div className={s.grid}>
              {cv.education.map((e, i) => (
                <div key={i} className={s.cell}>
                  <Field as="strong" path={`education.${i}.school`} value={e.school} />
                  <Field path={`education.${i}.degree`} value={e.degree} />
                  {e.degree && e.period && <span>, </span>}
                  <Field path={`education.${i}.period`} value={e.period} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {hasFoot && (
        <footer className={s.foot}>
          {cv.skills.length > 0 && (
            <section>
              <h2 className={s.footTitle}>Dovednosti</h2>
              <ul className={s.skills}>
                {cv.skills.map((skill, i) => (
                  <Field key={i} as="li" path={`skills.${i}`} value={skill} />
                ))}
              </ul>
            </section>
          )}
          {cv.languages.length > 0 && (
            <section>
              <h2 className={s.footTitle}>Jazyky</h2>
              <ul className={s.langs}>
                {cv.languages.map((l, i) => (
                  <li key={i}>
                    <Field path={`languages.${i}.language`} value={l.language} />
                    <Field path={`languages.${i}.level`} value={l.level} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </footer>
      )}
    </div>
  );
}
