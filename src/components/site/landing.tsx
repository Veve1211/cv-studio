import { LandingShowcase } from "./landing-showcase";

const STEPS = [
  ["Vlož text", "Starý životopis, LinkedIn nebo jen odrážky. Klidně neučesaně.", "M5 5h14v14H5zM8 9h8M8 12h8M8 15h5"],
  ["AI ho učeše", "Vytáhne praxi, vzdělání i dovednosti. Nic si nevymýšlí.", "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"],
  ["Vyber vzhled", "Pět neokoukaných šablon, sedm barev. Přepiš, co chceš.", "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"],
] as const;

export function Landing() {
  return (
    <section aria-labelledby="landing-title" className="hero-glow -mt-[4.5rem] overflow-hidden pt-[4.5rem] print:hidden">
      <div aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-24">
        <div>
          <p className="glass text-brand-strong mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]">
            <span aria-hidden="true" className="relative flex size-2">
              <span className="bg-brand absolute inline-flex size-full animate-ping rounded-full opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-[#2f8de4]" />
            </span>
            Životopis z pár vět
          </p>
          <h1
            id="landing-title"
            className="font-display text-[clamp(2.6rem,6.4vw,4.8rem)] font-bold leading-[0.98] tracking-[-0.045em]"
          >
            Napiš o sobě pár vět. Životopis ti poskládá <span className="text-gradient">AI.</span>
          </h1>
          <p className="text-ink-soft mt-6 max-w-xl text-lg leading-relaxed">Bez formulářů. Vlož text, máš životopis.</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#studio"
              className="btn-primary group inline-flex items-center gap-2 rounded-full py-4 pl-7 pr-5 text-base font-semibold"
            >
              Vytvořit životopis
              <span
                aria-hidden="true"
                className="grid size-7 place-items-center rounded-full bg-white/60 transition group-hover:translate-x-0.5"
              >
                →
              </span>
            </a>
            <span className="text-muted text-sm">Náhled zdarma, bez registrace</span>
          </div>
        </div>

        <div className="relative">
          <LandingShowcase />
          <div
            aria-hidden="true"
            className="glass float-slow absolute -top-4 left-2 hidden items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold sm:flex"
          >
            <span className="text-brand-strong">✦</span> Hotovo za pár vteřin
          </div>
          <div
            aria-hidden="true"
            className="glass float-slower absolute -right-3 top-[58%] hidden items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold sm:flex"
          >
            <span className="grid size-5 place-items-center rounded-full bg-[#2f8de4] text-[11px] text-white">✓</span>
            PDF ve formátu A4
          </div>
        </div>
      </div>

      <ol className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-3 sm:px-8">
        {STEPS.map(([title, text, icon], i) => (
          <li key={title} className="glass group rounded-[1.75rem] p-6 transition hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#bfe3ff] to-[#7cc4fb] text-[#0a4f99] shadow-[0_8px_20px_-10px_rgba(10,95,184,0.6)]">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
                  <path d={icon} />
                </svg>
              </span>
              <span aria-hidden="true" className="font-display text-brand-strong/40 text-sm font-bold tabular-nums">
                0{i + 1}
              </span>
            </div>
            <h2 className="font-display mt-5 text-xl font-bold tracking-[-0.02em]">{title}</h2>
            <p className="text-muted mt-1.5 leading-relaxed">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
