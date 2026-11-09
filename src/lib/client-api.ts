/** The AI can take a while, but the user should never wait forever. */
const TIMEOUT_MS = 150_000;

/** POSTs JSON and returns the parsed body, or throws an Error with a Czech message. */
export async function postJson(url: string, body: unknown, signal?: AbortSignal): Promise<unknown> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    if (timeout.aborted) throw new Error("Odpověď trvá moc dlouho. Zkus to prosím znovu.");
    throw new Error("Nepodařilo se spojit se serverem. Jsi online?");
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "Něco se pokazilo. Zkus to prosím znovu.";
    throw new Error(message);
  }
  return data;
}
