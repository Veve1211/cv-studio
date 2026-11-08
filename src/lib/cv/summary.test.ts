import { describe, expect, it, vi } from "vitest";
import type { MessagesClient } from "./generate";
import { SAMPLE_CV } from "./sample";
import { improveSummary, SUMMARY_SYSTEM_PROMPT } from "./summary";

const clientReturning = (text: string, stop = "end_turn") => {
  const create = vi.fn().mockResolvedValue({ stop_reason: stop, content: [{ type: "text", text }] });
  return { client: { beta: { messages: { create } } } as MessagesClient, create };
};

describe("improveSummary", () => {
  it("sends only the CV and returns the new summary", async () => {
    const { client, create } = clientReturning(JSON.stringify({ summary: "  Nové shrnutí.  " }));
    await expect(improveSummary(SAMPLE_CV, client)).resolves.toBe("Nové shrnutí.");
    const params = create.mock.calls[0][0];
    expect(params.system).toBe(SUMMARY_SYSTEM_PROMPT);
    expect(params.messages[0].content).toContain("Kvetoucí s.r.o.");
  });

  it("rejects empty summaries", async () => {
    const { client } = clientReturning(JSON.stringify({ summary: " " }));
    await expect(improveSummary(SAMPLE_CV, client)).rejects.toMatchObject({ status: 502 });
  });
});
