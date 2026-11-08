import Link from "next/link";

export function SiteHeader({ cta = true }: { cta?: boolean }) {
  return (
    <header className="border-line sticky top-0 z-20 flex items-center justify-between border-b bg-white/90 px-4 py-3 backdrop-blur sm:px-8 print:hidden">
      <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
        Cvéčko
      </Link>
      {cta && (
        <a
          href="#studio"
          className="bg-ink hover:bg-ink/90 rounded-full px-4 py-2 text-sm font-semibold text-white transition"
        >
          Vytvořit životopis
        </a>
      )}
    </header>
  );
}
