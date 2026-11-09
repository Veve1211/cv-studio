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
      <header className="glass sticky top-3 z-20 mx-3 mt-3 flex items-center justify-between rounded-full py-2 pl-5 pr-2 sm:mx-auto sm:w-[min(72rem,calc(100%-2rem))] print:hidden">
        <Link
          href="/"
          className="font-display flex items-center gap-2 text-2xl font-bold tracking-tight"
        >
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-full bg-gradient-to-br from-[#5bb6f7] to-[#0a5fb8]"
          />
          Cvéčko
        </Link>
        {cta && (
          <a
            href="#studio"
            className="btn-primary rounded-full px-5 py-2.5 text-sm font-semibold transition"
          >
            Vytvořit životopis
          </a>
        )}
      </header>
    </>
  );
}
