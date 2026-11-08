import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-line text-muted border-t bg-white px-4 py-8 text-sm sm:px-8 print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-display text-ink text-base font-semibold">Cvéčko</span> · životopis z pár vět
        </p>
        <nav aria-label="Patička" className="flex gap-5">
          <Link href="/soukromi" className="hover:text-ink underline-offset-4 hover:underline">
            Zásady ochrany osobních údajů
          </Link>
        </nav>
      </div>
    </footer>
  );
}
