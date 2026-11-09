import { isPaywallEnabled, PRICE_CZK } from "@/lib/payments/checkout";

const INCLUDED = [
  "Životopis i motivační dopis v jedné platbě",
  "PDF ve formátu A4, připravené k odeslání",
  "Všech 8 šablon a 7 barev",
  "Úpravy textu kdykoli před stažením",
];

/** Shown only when payments are on (STRIPE_SECRET_KEY); read per request. */
export function Pricing() {
  if (!isPaywallEnabled()) return null;
  return (
    <section aria-labelledby="pricing-title" className="mx-auto max-w-6xl px-4 pb-20 sm:px-8 print:hidden">
      <div className="glass grid gap-8 rounded-[2rem] p-7 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="text-brand-strong text-xs font-semibold uppercase tracking-[0.16em]">Cena</p>
          <h2 id="pricing-title" className="font-display mt-2 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
            Náhled zdarma. PDF za {PRICE_CZK} Kč.
          </h2>
          <p className="text-muted mt-3 text-lg leading-relaxed">
            Jednorázově, žádné předplatné ani registrace. Zaplatíš až ve chvíli, kdy jsi s výsledkem spokojen(á).
          </p>
        </div>
        <div className="rounded-3xl bg-white/80 p-6 shadow-[0_18px_40px_-20px_rgba(10,60,120,0.35)]">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-bold tracking-[-0.04em]">{PRICE_CZK} Kč</span>
            <span className="text-muted text-sm">jednorázově</span>
          </p>
          <ul className="mt-5 space-y-2.5">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span aria-hidden className="text-brand-strong font-bold">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          <a href="#studio" className="btn-primary mt-6 inline-flex rounded-full px-6 py-3 font-semibold">
            Vyzkoušet zdarma
          </a>
        </div>
      </div>
    </section>
  );
}
