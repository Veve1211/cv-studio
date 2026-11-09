import { LandingShowcase } from "./landing-showcase";

const STEPS = [
  ["Vlož text", "Starý životopis, LinkedIn nebo jen odrážky. Klidně neučesaně."],
  ["AI ho učeše", "Vytáhne praxi, vzdělání i dovednosti. Nic si nevymýšlí."],
  ["Vyber vzhled", "Pět neokoukaných šablon, šest barev. Přepiš, co chceš."],
] as const;

export function Landing() {
  return (
    <section aria-labelledby="landing-title" className="overflow-hidden print:hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
        <div>
          <p className="text-muted mb-4 text-sm font-semibold uppercase tracking-[0.18em]">Životopis z pár vět</p>
          <h1
            id="landing-title"
            className="font-display text-[clamp(2.4rem,6vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.03em]"
          >
            Napiš o sobě pár vět. Životopis ti poskládá AI.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#3b3a40]">
            Bez formulářů. Vlož text, máš životopis.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#studio"
              className="bg-ink hover:bg-ink/90 rounded-full px-7 py-4 text-base font-semibold text-white transition"
            >
              Vytvořit životopis
            </a>
            <span className="text-muted text-sm">Náhled zdarma, bez registrace</span>
          </div>
        </div>

        <LandingShowcase />
      </div>

      <ol className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 sm:grid-cols-3 sm:px-8">
        {STEPS.map(([title, text], i) => (
          <li key={title} className="border-line rounded-2xl border bg-white p-6">
            <span className="font-display text-3xl font-semibold text-[#c23d17]">{i + 1}</span>
            <h2 className="mt-2 text-lg font-semibold">{title}</h2>
            <p className="text-muted mt-1 leading-relaxed">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
