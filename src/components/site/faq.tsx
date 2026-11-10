import { plans } from "@/lib/access";
import { isPaywallEnabled } from "@/lib/payments/checkout";

interface QA {
  q: string;
  a: string;
}

export function faqItems(paid: boolean): QA[] {
  const items: QA[] = [
    {
      q: "Co se stane s textem, který vložím?",
      a: "Pošle se jen ve chvíli, kdy klikneš na „Vytvořit životopis“ (nebo sám spustíš dopis, přizpůsobení inzerátu či překlad), a to rovnou do AI (Claude), která z něj poskládá životopis. Na našem serveru se neukládá ani nezapisuje do logů. Hotový životopis drží jen tvůj prohlížeč – když stránku zavřeš, zmizí.",
    },
    {
      q: "Co AI dělá a co ne?",
      a: "Vytáhne z textu praxi, vzdělání, dovednosti a jazyky, srovná je a učeše formulace. Nepřidává firmy, roky, čísla ani dovednosti, které jsi nenapsal(a). Navíc výsledek porovnáme s tvým textem a co v něm nebylo, žlutě podtrhneme, ať to můžeš zkontrolovat.",
    },
    {
      q: "Můžu text po vytvoření upravit?",
      a: "Ano. Klikni do kteréhokoli textu v náhledu a přepiš ho. Šablonu i barvu můžeš měnit kdykoli, obsah zůstane.",
    },
    {
      q: "V jakém formátu dostanu životopis?",
      a: "Jako PDF ve formátu A4, přesně tak, jak ho vidíš v náhledu. Delší životopis se hezky zalomí na další stranu. Stejně to funguje i pro motivační dopis.",
    },
    {
      q: "Umíte přečíst můj starý životopis?",
      a: "Ano, nahraj PDF nebo Word (DOCX) do 5 MB, nebo ho přetáhni na levou stranu. Text se z něj vytáhne jen v paměti a soubor se hned zahodí. Naskenované obrázky přečíst neumíme.",
    },
  ];
  if (paid) {
    const [, short, year] = plans();
    items.push(
      {
        q: "Kolik to stojí?",
        a: `Náhled a úpravy jsou zdarma. Plný přístup (PDF bez vodoznaku, motivační dopis, přizpůsobení inzerátu a angličtina) je na 1 den zdarma, na 14 dní za ${short.priceCzk} Kč nebo na rok za ${year.priceCzk} Kč. Platíš jednorázově, nic se automaticky neobnovuje a nepotřebuješ účet.`,
      },
      {
        q: "Jak se dostanu k přístupu na jiném zařízení?",
        a: "Po zaplacení dostaneš krátký přístupový kód. Na jiném zařízení klikni na „Mám kód“ a vlož ho.",
      },
      {
        q: "Co když nebudu spokojen(á)?",
        a: "Zaplatíš až po tom, co výsledek vidíš v náhledu. Postup při reklamaci najdeš na stránce Reklamace.",
      },
    );
  }
  return items;
}

/** FAQ with native <details> (keyboard and screen-reader friendly) + FAQPage structured data. */
export function Faq({ nonce }: { nonce?: string }) {
  const items = faqItems(isPaywallEnabled());
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <section aria-labelledby="faq-title" className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-8 print:hidden">
      <h2 id="faq-title" className="font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
        Časté otázky
      </h2>
      <div className="mt-8 space-y-3">
        {items.map(({ q, a }) => (
          <details key={q} className="faq glass group rounded-2xl px-5 py-4 open:pb-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
              {q}
              <span aria-hidden className="text-brand-strong text-xl transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="text-muted mt-3 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        nonce={nonce}
        // Static texts above; "<" escaped so the JSON can never close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }}
      />
    </section>
  );
}
