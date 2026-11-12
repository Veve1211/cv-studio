import { Field } from "../field";
import { labels } from "../labels";
import type { TemplateProps } from "../types";
import s from "./terminal.module.css";

const CONTACTS = [
  ["email", "email"],
  ["phone", "telefon"],
  ["location", "lokace"],
  ["web", "web"],
] as const;

/** "Tereza Nováková" -> "tereza-novakova" for the fake file name. */
function slug(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "zivotopis"
  );
}

export function Terminal({ cv, lang }: TemplateProps) {
  const L = labels(lang);
  const contacts = CONTACTS.filter(([k]) => cv.contact[k]);
  return (
    <div className={s.root}>
      <div className={s.bar} aria-hidden>
        <span className={s.dots}>
          <i />
          <i />
          <i />
        </span>
        ~/cv/{slug(cv.name)}.md
      </div>

      <div className={s.content}>
        <p className={s.prompt} aria-hidden>
          <b>$</b> whoami
        </p>
        <Field as="h1" className={s.name} path="name" value={cv.name} placeholder="Tvoje jméno" />
        <Field as="p" className={s.headline} path="headline" value={cv.headline} />

        {contacts.length > 0 && (
          <dl className={s.kv}>
            {contacts.map(([k, label]) => (
              <div key={k} style={{ display: "contents" }}>
                <dt className={s.key}>{label}</dt>
                <Field as="dd" path={`contact.${k}`} value={cv.contact[k]} />
              </div>
            ))}
          </dl>
        )}

        <Field as="p" className={s.summary} path="summary" value={cv.summary} />

        {cv.experience.length > 0 && (
          <section className={s.section}>
            <h2 className={s.h2}>{L.experience.toLowerCase()}</h2>
            {cv.experience.map((e, i) => (
              <article key={i} className={s.job}>
                <div className={s.jobHead}>
                  <Field className={s.period} path={`experience.${i}.period`} value={e.period} />
                  <Field as="h3" className={s.role} path={`experience.${i}.role`} value={e.role} />
                  {e.company && <span className={s.at}>@</span>}
                  <Field path={`experience.${i}.company`} value={e.company} />
                </div>
                {e.highlights.length > 0 && (
                  <ul className={s.points}>
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
            <h2 className={s.h2}>{L.education.toLowerCase()}</h2>
            {cv.education.map((e, i) => (
              <div key={i} className={s.job}>
                <div className={s.jobHead}>
                  <Field className={s.period} path={`education.${i}.period`} value={e.period} />
                  <Field as="h3" className={s.role} path={`education.${i}.degree`} value={e.degree} />
                  {e.degree && e.school && <span className={s.at}>@</span>}
                  <Field path={`education.${i}.school`} value={e.school} />
                </div>
              </div>
            ))}
          </section>
        )}

        {(cv.skills.length > 0 || cv.languages.length > 0) && (
          <div className={`${s.section} ${s.cols}`}>
            {cv.skills.length > 0 && (
              <section>
                <h2 className={s.h2}>{L.skills.toLowerCase()}</h2>
                <ul className={s.tags}>
                  {cv.skills.map((skill, i) => (
                    <Field key={i} as="li" path={`skills.${i}`} value={skill} />
                  ))}
                </ul>
              </section>
            )}
            {cv.languages.length > 0 && (
              <section>
                <h2 className={s.h2}>{L.languages.toLowerCase()}</h2>
                <dl className={s.kv} style={{ marginTop: 0 }}>
                  {cv.languages.map((l, i) => (
                    <div key={i} style={{ display: "contents" }}>
                      <Field as="dt" className={s.key} path={`languages.${i}.language`} value={l.language} />
                      <Field as="dd" path={`languages.${i}.level`} value={l.level} placeholder="–" />
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
