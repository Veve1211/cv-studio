import { hasFullAccess } from "./access";
import { jsonError } from "./http";

/** Paid features (letter, tailoring, English, clean PDF) are checked on the server. */
export function requireAccess(request: Request): Response | null {
  if (hasFullAccess(request)) return null;
  return jsonError("Tahle funkce je součástí plného přístupu. Náhled životopisu máš zdarma.", 402);
}
