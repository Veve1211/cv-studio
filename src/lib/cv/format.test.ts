import { describe, expect, it } from "vitest";
import { contactItems, initials, isEmptyCv, splitPeriod, yearOf } from "./format";
import { EMPTY_CV } from "./schema";
import { SAMPLE_CV } from "./sample";

describe("format helpers", () => {
  it("splits periods with different dashes", () => {
    expect(splitPeriod("2019 – 2022")).toEqual({ start: "2019", end: "2022" });
    expect(splitPeriod("2021-dosud")).toEqual({ start: "2021", end: "dosud" });
    expect(splitPeriod("2018")).toEqual({ start: "2018", end: "" });
    expect(splitPeriod("")).toEqual({ start: "", end: "" });
  });

  it("extracts years", () => {
    expect(yearOf("03/2019")).toBe("2019");
    expect(yearOf("dosud")).toBe("dosud");
  });

  it("builds initials and contact list", () => {
    expect(initials("Tereza Nováková")).toBe("TN");
    expect(initials("")).toBe("");
    expect(contactItems({ ...EMPTY_CV, contact: { email: "a@b.cz", phone: "", location: "Brno", web: "" } })).toEqual([
      "a@b.cz",
      "Brno",
    ]);
  });

  it("detects empty CVs", () => {
    expect(isEmptyCv(EMPTY_CV)).toBe(true);
    expect(isEmptyCv(SAMPLE_CV)).toBe(false);
  });
});
