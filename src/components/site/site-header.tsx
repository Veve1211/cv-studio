import Link from "next/link";

export function SiteHeader({ cta = true }: { cta?: boolean }) {
  return (
    <>
      {cta && (
        <a
          href="#studio"
          className="bg-ink sr-only z-50 rounded-full px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Přeskočit na tvorbu životopisu
        </a>
      )}
      <header className="border-line sticky top-0 z-20 flex items-center justify-between border-b bg-white/70 px-4 py-3 backdrop-blur sm:px-8 print:hidden">
        <Link
          href="/"
          className="font-display flex items-center gap-2 text-2xl font-bold tracking-tight"
        >
          <span
            aria-hidden="true"
            className="bg-brand inline-block size-3 rounded-full"
          />
          Cvéčko
        </Link>
        {cta && (
          <a
            href="#studio"
            className="btn-primary rounded-full px-4 py-2 text-sm font-semibold transition"
          >
            Vytvořit životopis
          </a>
        )}
      </header>
    </>
  );
}
