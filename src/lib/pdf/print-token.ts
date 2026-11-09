import { createHmac, timingSafeEqual } from "node:crypto";

export const PRINT_HEADER = "x-cvecko-print";

/**
 * Secret that lets only our own headless browser open /tisk. Derived from a server
 * secret, so it is the same in every module and every process, and never sent to users.
 */
export function printToken(): string {
  const secret = process.env.PDF_RENDER_SECRET || process.env.STRIPE_SECRET_KEY || "";
  if (!secret) return "";
  return createHmac("sha256", secret).update("cvecko-print-v1").digest("hex");
}

export function isValidPrintToken(value: string | null | undefined): boolean {
  const expected = printToken();
  if (!expected || !value || value.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}
