import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** Shared layout for the terms / complaints pages. */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader cta={false} />
      <main className="flex-1 bg-white px-4 py-12 sm:px-8">
        <article className="mx-auto max-w-2xl leading-relaxed [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:mt-2 [&_p]:mt-4 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
          <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Pracovní verze. Údaje označené [DOPLNIT] musí provozovatel doplnit a text by měl zkontrolovat právník.
          </p>
          {children}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

/** Placeholder for data that must never be invented. */
export function Fill({ what }: { what: string }) {
  return <mark className="rounded bg-amber-100 px-1 text-amber-950">[DOPLNIT: {what}]</mark>;
}
