import { beforeEach, describe, expect, it, vi } from "vitest";
import { AttendanceStatus } from "@/src/gql/schema";

const xlsx = vi.hoisted(() => ({
  utils: {
    aoa_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

vi.mock("xlsx", () => xlsx);

describe("XLSX exports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes attendance workbook", async () => {
    const { exportAttendanceToXlsx } = await import("./export-attendance");

    exportAttendanceToXlsx({
      className: "Turma A",
      dates: [new Date("2026-06-25T12:00:00.000Z")],
      enrollments: [{ id: "enr-1", student: { id: "stu-1", name: "Ana" } }],
      records: [
        { enrollmentId: "enr-1", status: AttendanceStatus.Late, session: { date: "2026-06-25" } },
      ],
    });

    expect(xlsx.writeFile).toHaveBeenCalledWith(expect.anything(), "Turma A-presencas.xlsx");
  });

  it("writes grades workbook", async () => {
    const { exportGradesToXlsx } = await import("./export-grades");

    exportGradesToXlsx({
      className: "Turma A",
      evaluations: [{ id: "eval-1", title: "P1", maxScore: 10 }],
      enrollments: [{ id: "enr-1", student: { id: "stu-1", name: "Ana" } }],
      grades: [{ enrollmentId: "enr-1", evaluationId: "eval-1", score: 8 }],
    });

    expect(xlsx.writeFile).toHaveBeenCalledWith(expect.anything(), "Turma A-notas.xlsx");
  });
});
