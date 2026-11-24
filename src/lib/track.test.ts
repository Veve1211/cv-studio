import { afterEach, describe, expect, it, vi } from "vitest";
import { track } from "./track";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("track", () => {
  it("does nothing on the server or without an analytics script", () => {
    expect(() => track("CV vytvořeno")).not.toThrow();
    vi.stubGlobal("window", {});
    expect(() => track("CV vytvořeno")).not.toThrow();
  });

  it("sends only the event name to Plausible", () => {
    const plausible = vi.fn();
    vi.stubGlobal("window", { plausible });
    track("PDF stažení");
    expect(plausible).toHaveBeenCalledWith("PDF stažení");
  });

  it("sends only the event name to Umami", () => {
    const umamiTrack = vi.fn();
    vi.stubGlobal("window", { umami: { track: umamiTrack } });
    track("CV vytvořeno");
    expect(umamiTrack).toHaveBeenCalledWith("CV vytvořeno");
  });

  it("never throws when the analytics script fails", () => {
    vi.stubGlobal("window", {
      plausible: () => {
        throw new Error("blocked");
      },
    });
    expect(() => track("PDF stažení")).not.toThrow();
  });
});
