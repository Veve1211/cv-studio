import { describe, expect, it } from "vitest";
import { UNVERIFIED } from "./before-after";

describe("before/after demo", () => {
  it("flags exactly the web address (the caption says 'Web …')", () => {
    expect([...UNVERIFIED.keys()]).toEqual(["contact.web"]);
  });
});
