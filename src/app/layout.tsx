import type { Metadata, Viewport } from "next";
import { Analytics } from "@/components/site/analytics";
import { StructuredData } from "@/components/site/structured-data";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, siteUrl } from "@/lib/site";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_TITLE, template: `%s – ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["životopis", "CV", "motivační dopis", "šablona životopisu", "AI", "životopis online"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#f2f8ff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="cs" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <StructuredData />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
