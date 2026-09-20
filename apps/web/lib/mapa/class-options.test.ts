import { describe, expect, it } from "vitest";
import { gradeOptionsFor, sectionOptionsFor } from "./class-options";
import { GRADE_OPTIONS, SECTION_OPTIONS } from "./constants";

describe("gradeOptionsFor", () => {
  it("keeps the prototype grade list when nothing extra is assigned", () => {
    expect(gradeOptionsFor(undefined)).toEqual([...GRADE_OPTIONS]);
  });

  it("prepends an assigned grade that is not in the prototype list", () => {
    expect(gradeOptionsFor("5º")).toEqual(["5º", ...GRADE_OPTIONS]);
  });
});

describe("sectionOptionsFor", () => {
  it("keeps A-H when nothing extra was added", () => {
    expect(sectionOptionsFor([])).toEqual([...SECTION_OPTIONS]);
  });

  it("appends a newly added section after the prototype list", () => {
    expect(sectionOptionsFor(["I"], "A")).toEqual([...SECTION_OPTIONS, "I"]);
  });
});
