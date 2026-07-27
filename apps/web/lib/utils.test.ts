import { describe, expect, it } from "vitest";
import { sortByStudentName } from "./utils";

describe("sortByStudentName", () => {
  const items = [{ student: { name: "Aluno 10" } }, { student: { name: "Aluno 2" } }];

  it("sorts by student name ascending with numeric collation", () => {
    expect(sortByStudentName(items, "asc").map((x) => x.student.name)).toEqual([
      "Aluno 2",
      "Aluno 10",
    ]);
  });

  it("sorts by student name descending", () => {
    expect(sortByStudentName(items, "desc").map((x) => x.student.name)).toEqual([
      "Aluno 10",
      "Aluno 2",
    ]);
  });
});
