import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

/** schema.org description of the app for search engines (static, no user data). */
export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: siteUrl(),
    description: SITE_DESCRIPTION,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "cs",
    isAccessibleForFree: true,
  };
  // Static object; "<" is escaped so the JSON can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
