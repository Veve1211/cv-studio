import { Landing } from "@/components/site/landing";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { CvStudio } from "@/components/studio/cv-studio";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Landing />
        <CvStudio />
      </main>
      <SiteFooter />
    </>
  );
}
