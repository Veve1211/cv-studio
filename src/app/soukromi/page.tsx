import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "Zásady ochrany osobních údajů",
  alternates: { canonical: "/soukromi" },
  description: "Jak Cvéčko zachází s tvými údaji: nic neukládáme.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader cta={false} />
      <main className="flex-1 bg-white px-4 py-12 sm:px-8">
        <article className="mx-auto max-w-2xl leading-relaxed [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:mt-2 [&_p]:mt-4 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Zásady ochrany osobních údajů</h1>
          <p className="text-lg">
            Krátce: <strong>tvoje data neukládáme.</strong> Životopis existuje jen v tvém prohlížeči, dokud máš
            stránku otevřenou.
          </p>

          <h2>Co se děje s textem, který vložíš</h2>
          <ul>
            <li>
              Text se odešle jen ve chvíli, kdy klikneš na „Vytvořit životopis“ (nebo „Vylepšit shrnutí“), a to
              přímo do služby Claude od společnosti Anthropic, která z něj sestaví životopis.
            </li>
            <li>Na našem serveru se text ani životopis neukládá a nezapisuje do žádných logů.</li>
            <li>
              Když nahraješ starý životopis (PDF nebo Word), server z něj jen v paměti vytáhne text a soubor hned
              zahodí. Nikam se neukládá.
            </li>
            <li>Hotový životopis drží jen tvůj prohlížeč. Když stránku zavřeš nebo obnovíš, zmizí.</li>
            <li>
              Anthropic s daty zachází podle svých obchodních podmínek a zásad ochrany soukromí.
            </li>
          </ul>

          <h2>Platba za PDF</h2>
          <ul>
            <li>
              Pokud je platba zapnutá, probíhá přes Stripe. Údaje o kartě zadáváš přímo u Stripe, my je nikdy
              nevidíme.
            </li>
            <li>
              Zaplacené PDF vytvoří náš server: životopis pošleš jen pro tento jeden požadavek, server z něj v paměti
              udělá PDF a hned ho zapomene.
            </li>
            <li>
              Kvůli přesměrování na platební bránu se životopis na tu chvíli uloží do úložiště tvého prohlížeče (jen
              v tomto okně) a po návratu se hned smaže.
            </li>
          </ul>

          <h2>Cookies a měření</h2>
          <p>Nepoužíváme analytické ani reklamní cookies a nesledujeme tě.</p>

          <h2>Ochrana proti zneužití</h2>
          <p>
            Abychom zabránili zahlcení služby, krátce si v paměti serveru pamatujeme počet požadavků z tvé IP adresy.
            Po restartu serveru nebo po 15 minutách se tento údaj zahodí.
          </p>

          <p className="mt-12">
            <Link href="/" className="font-semibold underline underline-offset-4">
              ← Zpět na tvorbu životopisu
            </Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
