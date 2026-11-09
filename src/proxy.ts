import { NextResponse, type NextRequest } from "next/server";
import { analyticsOrigin, buildCsp } from "@/lib/csp";
import { isValidPrintToken, PRINT_HEADER } from "@/lib/pdf/print-token";

/**
 * 1) Every page gets a fresh nonce and a strict Content-Security-Policy.
 * 2) /tisk (clean CV for the server-side PDF) is only for our own headless browser,
 *    which sends the secret header; everyone else gets 404.
 */
export function proxy(request: NextRequest) {
  const isPrint = request.nextUrl.pathname === "/tisk" || request.nextUrl.pathname.startsWith("/tisk/");
  if (isPrint && !isValidPrintToken(request.headers.get(PRINT_HEADER))) {
    return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp({
    nonce,
    dev: process.env.NODE_ENV === "development",
    https: request.headers.get("x-forwarded-proto") === "https" || request.nextUrl.protocol === "https:",
    analyticsOrigin: analyticsOrigin(),
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  if (isPrint) {
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex");
  }
  return response;
}

export const config = {
  matcher: [
    {
      // pages only: not API routes, static files, images or metadata files
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|opengraph-image|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
