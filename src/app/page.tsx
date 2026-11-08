import { CvStudio } from "@/components/studio/cv-studio";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="border-line flex items-center justify-between border-b bg-white px-4 py-3 sm:px-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Cvéčko</h1>
        <p className="text-muted hidden text-sm sm:block">Bez formulářů. Vlož text, máš životopis.</p>
      </header>
      <CvStudio />
    </main>
  );
}
