import { describe, expect, it } from "vitest";
import { contactItems, splitPeriod } from "./format";
import { EMPTY_CV } from "./schema";

describe("format helpers", () => {
  it("splits periods with different dashes", () => {
    expect(splitPeriod("2019 – 2022")).toEqual({ start: "2019", end: "2022" });
    expect(splitPeriod("2021-dosud")).toEqual({ start: "2021", end: "dosud" });
    expect(splitPeriod("2018")).toEqual({ start: "2018", end: "" });
    expect(splitPeriod("")).toEqual({ start: "", end: "" });
  });

  it("builds the contact list", () => {
    expect(contactItems({ ...EMPTY_CV, contact: { email: "a@b.cz", phone: "", location: "Brno", web: "" } })).toEqual([
      "a@b.cz",
      "Brno",
    ]);
  });
});
