import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isPaywallEnabled } from "@/lib/payments/checkout";
import Link from "next/link";
import { Fill, LegalPage } from "@/components/site/legal-page";
import { plans } from "@/lib/access";

export const metadata: Metadata = {
  title: "Obchodní podmínky",
  alternates: { canonical: "/obchodni-podminky" },
  description: "Obchodní podmínky služby Cvéčko.",
};

export default function TermsPage() {
  // Without payments there is nothing to sell: no terms, nothing about payments.
  if (!isPaywallEnabled()) notFound();
  const [trial, short, year] = plans();
  return (
    <LegalPage title="Obchodní podmínky">
      <h2>1. Provozovatel</h2>
      <ul>
        <li>
          Provozovatel: <Fill what="jméno a příjmení / název firmy" />
        </li>
        <li>
          IČO: <Fill what="IČO" />
        </li>
        <li>
          Sídlo / adresa: <Fill what="adresa" />
        </li>
        <li>
          Kontakt: <Fill what="e-mail" />
        </li>
      </ul>

      <h2>2. Co služba nabízí</h2>
      <p>
        Cvéčko z textu, který uživatel vloží, sestaví pomocí AI životopis. Náhled a úpravy životopisu jsou zdarma.
        Plný přístup obsahuje PDF bez vodoznaku, motivační dopis k inzerátu, přizpůsobení životopisu inzerátu a
        anglickou verzi.
      </p>

      <h2>3. Cena a doba přístupu</h2>
      <ul>
        <li>{trial.name}: jednou na prohlížeč, bez platby.</li>
        <li>
          {short.name}: {short.priceCzk} Kč jednorázově.
        </li>
        <li>
          {year.name}: {year.priceCzk} Kč jednorázově.
        </li>
        <li>Nejde o předplatné. Nic se automaticky neobnovuje, přístup po uplynutí doby sám skončí.</li>
        <li>
          Plátce DPH: <Fill what="ano / ne" />
        </li>
      </ul>

      <h2>4. Platba a zahájení plnění</h2>
      <p>
        Platí se kartou přes platební bránu Stripe. Přístup se zpřístupní hned po zaplacení. Před platbou uživatel
        výslovně souhlasí s těmito podmínkami a se zahájením plnění před uplynutím lhůty pro odstoupení od smlouvy.
      </p>
      <p>
        Odstoupení od smlouvy u digitálního obsahu: <Fill what="znění podle občanského zákoníku, ověřit s právníkem" />
      </p>

      <h2>5. Přístup bez účtu</h2>
      <p>
        Cvéčko nemá uživatelské účty. Přístup se uloží do podepsaného cookie v prohlížeči. Pro jiné zařízení slouží
        krátký přístupový kód, který uživatel po zaplacení uvidí a vloží přes „Mám kód“. Kdo kód zná, může přístup
        použít, proto ho nesdílej.
      </p>

      <h2>6. Osobní údaje</h2>
      <p>
        Text ani životopis neukládáme. Podrobnosti jsou v <Link href="/soukromi">zásadách ochrany osobních údajů</Link>.
      </p>

      <h2>7. Reklamace</h2>
      <p>
        Postup najdeš na stránce <Link href="/reklamace">Reklamace</Link>.
      </p>

      <h2>8. Závěrečná ustanovení</h2>
      <p>
        Účinnost od: <Fill what="datum" />. Mimosoudní řešení sporů: <Fill what="ČOI / jiný subjekt, ověřit" />
      </p>
    </LegalPage>
  );
}
