import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cvéčko – životopis z pár vět",
  description: "Bez formulářů. Vlož text o sobě a AI z něj udělá moderní životopis.",
};

export const viewport: Viewport = {
  themeColor: "#f4f2ee",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="cs" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
