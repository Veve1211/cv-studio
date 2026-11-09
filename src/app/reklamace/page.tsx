import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isPaywallEnabled } from "@/lib/payments/checkout";
import { Fill, LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Reklamace",
  alternates: { canonical: "/reklamace" },
  description: "Jak reklamovat službu Cvéčko.",
};

export default function ComplaintsPage() {
  // Without payments there is nothing to sell: no terms, nothing about payments.
  if (!isPaywallEnabled()) notFound();
  return (
    <LegalPage title="Reklamace">
      <h2>Kdy reklamovat</h2>
      <p>
        Když po zaplacení nejde stáhnout PDF, nefunguje placená funkce nebo s výsledkem něco není v pořádku.
      </p>

      <h2>Jak reklamovat</h2>
      <ul>
        <li>
          Napiš na: <Fill what="e-mail pro reklamace" />
        </li>
        <li>Uveď datum platby a co nefunguje. Životopis ani text neposílej, nepotřebujeme ho.</li>
        <li>
          Lhůta pro vyřízení: <Fill what="lhůta podle zákona, ověřit" />
        </li>
        <li>
          Způsob vrácení peněz: <Fill what="postup" />
        </li>
      </ul>

      <h2>Provozovatel</h2>
      <p>
        <Fill what="jméno / firma, IČO, adresa" />
      </p>
    </LegalPage>
  );
}
