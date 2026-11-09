import { headers } from "next/headers";
import { BeforeAfter } from "@/components/site/before-after";
import { Faq } from "@/components/site/faq";
import { Landing } from "@/components/site/landing";
import { Pricing } from "@/components/site/pricing";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { CvStudio } from "@/components/studio/cv-studio";

export default async function Home() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Landing />
        <BeforeAfter />
        <Pricing />
        <CvStudio />
        <Faq nonce={nonce} />
      </main>
      <SiteFooter />
    </>
  );
}
