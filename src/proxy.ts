import { NextResponse, type NextRequest } from "next/server";
import { isValidPrintToken, PRINT_HEADER } from "@/lib/pdf/print-token";

/**
 * /tisk renders a clean, watermark-free CV for the server-side PDF. Only our own
 * headless browser (which sends the secret header) may open it; everyone else gets 404.
 */
export function proxy(request: NextRequest) {
  if (!isValidPrintToken(request.headers.get(PRINT_HEADER))) {
    return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

export const config = {
  matcher: ["/tisk", "/tisk/:path*"],
};
