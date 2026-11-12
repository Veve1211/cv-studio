import { contactItems } from "@/lib/cv/format";
import { Field } from "../field";
import { labels } from "../labels";
import type { TemplateProps } from "../types";
import s from "./minimal.module.css";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className={s.row}>
      <h2 className={s.label}>{label}</h2>
      <div>{children}</div>
    </section>
  );
}

export function Minimal({ cv, lang }: TemplateProps) {
  const L = labels(lang);
  const contacts = contactItems(cv);
  return (
    <div className={s.root}>
      <header className={s.head}>
        <div>
          <Field as="h1" className={s.name} path="name" value={cv.name} placeholder="Tvoje jméno" />
          <Field as="p" className={s.headline} path="headline" value={cv.headline} />
        </div>
        {contacts.length > 0 && (
          <ul className={s.contact}>
            {(["email", "phone", "location", "web"] as const).map((k) => (
              <Field key={k} as="li" path={`contact.${k}`} value={cv.contact[k]} />
            ))}
          </ul>
        )}
      </header>

      {cv.summary && (
        <Row label={L.profile}>
          <Field as="p" className={s.summary} path="summary" value={cv.summary} />
        </Row>
      )}

      {cv.experience.length > 0 && (
        <Row label={L.experience}>
          {cv.experience.map((e, i) => (
            <div key={i} className={s.item}>
              <div className={s.itemHead}>
                <h3 className={s.itemTitle}>
                  <Field path={`experience.${i}.role`} value={e.role} />
                  {e.role && e.company && ", "}
                  <Field className={s.sub} path={`experience.${i}.company`} value={e.company} />
                </h3>
                <Field className={s.period} path={`experience.${i}.period`} value={e.period} />
              </div>
              {e.highlights.length > 0 && (
                <ul className={s.points}>
                  {e.highlights.map((h, j) => (
                    <Field key={j} as="li" path={`experience.${i}.highlights.${j}`} value={h} />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Row>
      )}

      {cv.education.length > 0 && (
        <Row label={L.education}>
          {cv.education.map((e, i) => (
            <div key={i} className={s.item}>
              <div className={s.itemHead}>
                <h3 className={s.itemTitle}>
                  <Field path={`education.${i}.degree`} value={e.degree} />
                  {e.degree && e.school && ", "}
                  <Field className={s.sub} path={`education.${i}.school`} value={e.school} />
                </h3>
                <Field className={s.period} path={`education.${i}.period`} value={e.period} />
              </div>
            </div>
          ))}
        </Row>
      )}

      {cv.skills.length > 0 && (
        <Row label={L.skills}>
          <ul className={s.tags}>
            {cv.skills.map((skill, i) => (
              <Field key={i} as="li" className={s.tag} path={`skills.${i}`} value={skill} />
            ))}
          </ul>
        </Row>
      )}

      {cv.languages.length > 0 && (
        <Row label={L.languages}>
          <ul className={s.tags}>
            {cv.languages.map((l, i) => (
              <li key={i} className={s.tag}>
                <Field path={`languages.${i}.language`} value={l.language} />
                <Field className={s.level} path={`languages.${i}.level`} value={l.level} />
              </li>
            ))}
          </ul>
        </Row>
      )}
    </div>
  );
}
