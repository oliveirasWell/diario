export { cn } from "cnfast";

export function sortByStudentName<T extends { student: { name: string } }>(
  items: readonly T[],
  dir: "asc" | "desc",
): T[] {
  return [...items].sort((a, b) =>
    dir === "asc"
      ? a.student.name.localeCompare(b.student.name, undefined, { numeric: true })
      : b.student.name.localeCompare(a.student.name, undefined, { numeric: true }),
  );
}
