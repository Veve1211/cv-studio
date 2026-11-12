/**
 * The AI may take a while, but never forever: the server gives up after ~55 s, the
 * browser a little later (in case the answer gets lost on the way).
 */
export const CLIENT_TIMEOUT_MS = 65_000;
export const TIMEOUT_MESSAGE = "AI teď neodpověděla. Zkus to prosím znovu.";

/** POSTs JSON and returns the parsed body, or throws an Error with a Czech message. */
export async function postJson(url: string, body: unknown, signal?: AbortSignal): Promise<unknown> {
  // A plain timer (not AbortSignal.timeout) so tests can fast-forward the clock.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, CLIENT_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  if (signal?.aborted) controller.abort();

  try {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if (timedOut) throw new Error(TIMEOUT_MESSAGE);
      if (signal?.aborted) throw err;
      throw new Error("Nepodařilo se spojit se serverem. Jsi online?");
    }
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // The body itself can stall or be cut off.
      if (timedOut) throw new Error(TIMEOUT_MESSAGE);
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    }
    if (!res.ok) {
      const message =
        data && typeof data === "object" && "error" in data && typeof data.error === "string"
          ? data.error
          : "Něco se pokazilo. Zkus to prosím znovu.";
      throw new Error(message);
    }
    return data;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
