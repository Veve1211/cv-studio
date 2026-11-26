import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
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
  // Google Search Console ownership check; must stay in place permanently.
  verification: {
    google: "3rKgZFnPvp7-zFmbHVV5roVqvvg2WpZQEtJXu2wGjoE",
    other: { "seznam-wmt": "ShB4nDb6AEyn2MP1A8LdrapSIgn9KYKQ" },
  },
};

export const viewport: Viewport = {
  themeColor: "#f2f8ff",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Reading the request makes every page dynamic, so each gets its own CSP nonce.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="cs" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <StructuredData nonce={nonce} />
        {children}
        <Analytics nonce={nonce} />
      </body>
    </html>
  );
}
