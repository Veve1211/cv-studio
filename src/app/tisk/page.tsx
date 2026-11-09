import type { Metadata } from "next";
import { PrintView } from "./print-view";

export const metadata: Metadata = {
  title: "Tisk – Cvéčko",
  robots: { index: false, follow: false },
};

/** Internal page for the server-side PDF (guarded by src/proxy.ts). */
export default function PrintPage() {
  return <PrintView />;
}
