import Link from "next/link";
import { isPaywallEnabled } from "@/lib/payments/checkout";
import { kofiUrl } from "@/lib/site";
import { KofiLink } from "./kofi-link";

export function SiteFooter() {
  const paid = isPaywallEnabled();
  const kofi = kofiUrl();
  return (
    <footer className="border-line text-muted border-t bg-white/60 px-4 backdrop-blur pt-8 pb-28 lg:pb-8 text-sm sm:px-8 print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-display text-ink text-base font-semibold">Cvéčko</span> · životopis z pár vět
        </p>
        <nav aria-label="Patička" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/soukromi" className="hover:text-ink underline-offset-4 hover:underline">
            Zásady ochrany osobních údajů
          </Link>
          {paid && (
            <>
              <Link href="/obchodni-podminky" className="hover:text-ink underline-offset-4 hover:underline">
                Obchodní podmínky
              </Link>
              <Link href="/reklamace" className="hover:text-ink underline-offset-4 hover:underline">
                Reklamace
              </Link>
            </>
          )}
          {kofi && (
            <KofiLink
              href={kofi}
              className="border-line hover:border-brand-strong text-ink rounded-full border bg-white px-3 py-1 font-semibold transition"
            />
          )}
        </nav>
      </div>
    </footer>
  );
}
