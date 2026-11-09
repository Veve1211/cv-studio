import { connection } from "next/server";
import { demoCookie, demoUntil, isDemoEnabled } from "@/lib/demo";
import { jsonError } from "@/lib/http";

const NO_STORE = { "Cache-Control": "no-store" };

/** Is presentation mode on for this browser? */
export async function GET(request: Request) {
  await connection();
  return Response.json({ enabled: isDemoEnabled(), until: demoUntil(request) }, { headers: NO_STORE });
}

/** Turns presentation mode on for this browser (only with DEMO_ENABLED=1). */
export async function POST(request: Request) {
  if (!isDemoEnabled()) return jsonError("Prezentační režim není na serveru zapnutý.", 404);
  const { until, header } = demoCookie(request);
  const headers = new Headers(NO_STORE);
  headers.append("Set-Cookie", header);
  return Response.json({ enabled: true, until }, { headers });
}
