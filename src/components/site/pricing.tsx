import { plans } from "@/lib/access";
import { isPaywallEnabled } from "@/lib/payments/checkout";

const INCLUDED = [
  "PDF bez vodoznaku",
  "Motivační dopis k inzerátu",
  "Přizpůsobení inzerátu",
  "Anglická verze",
];

/** Shown only when payments are on (STRIPE_SECRET_KEY); prices read per request. */
export function Pricing() {
  if (!isPaywallEnabled()) return null;
  const [trial, short, year] = plans();
  const cards = [
    { plan: trial, note: "jednou na prohlížeč", cta: "Vyzkoušet zdarma", best: false },
    { plan: short, note: "jednorázově", cta: `Za ${short.priceCzk} Kč`, best: false },
    { plan: year, note: "jednorázově", cta: `Za ${year.priceCzk} Kč`, best: true },
  ];
  return (
    <section aria-labelledby="pricing-title" className="mx-auto max-w-6xl px-4 pb-20 sm:px-8 print:hidden">
      <p className="text-brand-strong text-xs font-semibold uppercase tracking-[0.16em]">Cena</p>
      <h2 id="pricing-title" className="font-display mt-2 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
        Náhled vždy zdarma. Plný přístup na čas.
      </h2>
      <p className="text-muted mt-3 max-w-2xl text-lg leading-relaxed">
        Žádné předplatné ani automatické obnovení. Zaplatíš jednou a po uplynutí doby přístup sám skončí.
      </p>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {cards.map(({ plan, note, cta, best }) => (
          <li
            key={plan.id}
            data-testid={`plan-${plan.id}`}
            className={`relative flex flex-col rounded-3xl bg-white/85 p-6 shadow-[0_18px_40px_-20px_rgba(10,60,120,0.35)] ${
              best ? "ring-brand-strong ring-2" : "border-line border"
            }`}
          >
            {best && (
              <span className="bg-brand-strong absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold text-white">
                Nejvýhodnější
              </span>
            )}
            <p className="font-display text-xl font-bold">{plan.name}</p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold tracking-[-0.04em]">
                {plan.priceCzk === 0 ? "0 Kč" : `${plan.priceCzk} Kč`}
              </span>
              <span className="text-muted text-sm">{note}</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2">
              {INCLUDED.map((item) => (
                <li key={item} className="flex gap-2.5 text-[15px]">
                  <span aria-hidden className="text-brand-strong font-bold">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <a
              // Paid plans go to the app with the plan preselected; paying happens at the PDF download.
              href={plan.id === "trial" ? "#studio" : `/?tarif=${plan.id}#studio`}
              className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-full px-6 font-semibold ${
                best ? "btn-primary" : "border-line hover:border-brand-strong border bg-white"
              }`}
            >
              {cta}
            </a>
          </li>
        ))}
      </ul>
      <p className="text-muted mt-4 text-sm">
        Platí pro životopis i motivační dopis. Kupuješ v klidu: nejdřív uvidíš výsledek v náhledu.{" "}
        <a href="/obchodni-podminky" className="underline underline-offset-4">
          Obchodní podmínky
        </a>
      </p>
    </section>
  );
}
