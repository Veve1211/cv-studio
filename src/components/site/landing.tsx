import { LandingShowcase } from "./landing-showcase";

const STEPS = [
  [
    "Vlož text",
    "Starý životopis, LinkedIn nebo jen odrážky. Klidně neučesaně.",
  ],
  ["AI ho učeše", "Vytáhne praxi, vzdělání i dovednosti. Nic si nevymýšlí."],
  ["Vyber vzhled", "Pět neokoukaných šablon, sedm barev. Přepiš, co chceš."],
] as const;

export function Landing() {
  return (
    <section
      aria-labelledby="landing-title"
      className="overflow-hidden print:hidden"
    >
      <div className="hero-glow">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
          <div>
            <p className="border-line text-brand-strong mb-5 inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur">
              <span
                aria-hidden="true"
                className="bg-brand inline-block size-2 rounded-full"
              />
              Životopis z pár vět
            </p>
            <h1
              id="landing-title"
              className="font-display text-[clamp(2.4rem,6vw,4.4rem)] font-bold leading-[1.02] tracking-[-0.04em]"
            >
              Napiš o sobě pár vět. Životopis ti poskládá{" "}
              <span className="text-brand-strong">AI.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Bez formulářů. Vlož text, máš životopis.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#studio"
                className="btn-primary rounded-full px-7 py-4 text-base font-semibold transition"
              >
                Vytvořit životopis
              </a>
              <span className="text-muted text-sm">
                Náhled zdarma, bez registrace
              </span>
            </div>
          </div>

          <LandingShowcase />
        </div>
      </div>

      <ol className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 pt-4 sm:grid-cols-3 sm:px-8">
        {STEPS.map(([title, text], i) => (
          <li
            key={title}
            className="border-line rounded-3xl border bg-white/80 p-6 shadow-[0_10px_30px_-18px_rgba(10,95,184,0.35)] backdrop-blur transition hover:-translate-y-0.5"
          >
            <span className="font-display bg-brand-soft text-brand-strong grid size-10 place-items-center rounded-2xl text-lg font-bold">
              {i + 1}
            </span>
            <h2 className="mt-4 text-lg font-semibold">{title}</h2>
            <p className="text-muted mt-1 leading-relaxed">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
