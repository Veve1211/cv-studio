import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader cta={false} />
      <main className="grid flex-1 place-items-center px-4 py-20 text-center">
        <div>
          <p className="font-display text-7xl font-semibold text-brand-strong">404</p>
          <h1 className="font-display mt-4 text-3xl font-semibold">Tahle stránka tu není</h1>
          <p className="text-muted mt-2">Možná se překlep vloudil do adresy.</p>
          <Link href="/" className="btn-primary mt-8 inline-block rounded-full px-6 py-3 font-semibold">
            Zpět na Cvéčko
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
