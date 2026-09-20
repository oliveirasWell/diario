import { GRADE_OPTIONS, SECTION_OPTIONS } from "./constants";

export const ADD_SECTION_VALUE = "__add__";

const uniquePreservingOrder = (values: string[]): string[] => [...new Set(values)];

export const gradeOptionsFor = (...assignedGrades: Array<string | undefined>): string[] => {
  const extras = assignedGrades.filter(
    (grade): grade is string =>
      typeof grade === "string" && grade.length > 0 && !GRADE_OPTIONS.includes(grade),
  );
  return uniquePreservingOrder([...extras, ...GRADE_OPTIONS]);
};

export const sectionOptionsFor = (
  extraSections: readonly string[],
  ...assignedSections: Array<string | undefined>
): string[] => {
  const extras = [...extraSections, ...assignedSections].filter(
    (section): section is string =>
      typeof section === "string" && section.length > 0 && !SECTION_OPTIONS.includes(section),
  );
  return uniquePreservingOrder([...SECTION_OPTIONS, ...extras]);
};
