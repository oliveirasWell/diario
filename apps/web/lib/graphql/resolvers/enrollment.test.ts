import { describe, expect, it } from "vitest";
import { anonymousContext, teacherContext } from "@/test/graphql-context";
import { prismaMock } from "@/test/prisma-mock";
import { enrollmentMutationResolvers, enrollmentQueryResolvers } from "./enrollment";

const CLASS_ID = "class-1";
const ENROLLMENT_ID = "enrollment-1";
const STUDENT_ID = "student-1";

describe("enrollmentQueryResolvers.enrollments", () => {
  it("returns nothing for anonymous users", async () => {
    await expect(
      enrollmentQueryResolvers.enrollments(null, { classId: CLASS_ID }, anonymousContext),
    ).resolves.toEqual([]);
  });

  it("returns the enrollments of an accessible class", async () => {
    prismaMock.enrollment.findMany.mockResolvedValue([{ id: ENROLLMENT_ID }]);

    await expect(
      enrollmentQueryResolvers.enrollments(null, { classId: CLASS_ID }, teacherContext),
    ).resolves.toEqual([{ id: ENROLLMENT_ID }]);
  });
});

describe("enrollmentMutationResolvers.createAndEnroll", () => {
  it("trims and lowercases the student email", async () => {
    prismaMock.class.findFirst.mockResolvedValue({ id: CLASS_ID });
    prismaMock.student.create.mockResolvedValue({ id: STUDENT_ID });
    prismaMock.enrollment.create.mockResolvedValue({ id: ENROLLMENT_ID });

    await expect(
      enrollmentMutationResolvers.createAndEnroll(
        null,
        { classId: CLASS_ID, name: "Ana", email: " ANA@EXAMPLE.COM " },
        teacherContext,
      ),
    ).resolves.toEqual({ id: ENROLLMENT_ID });
    expect(prismaMock.student.create).toHaveBeenCalledWith({
      data: { name: "Ana", email: "ana@example.com" },
    });
  });
});

describe("enrollmentMutationResolvers.unenrollStudent", () => {
  it("deletes the attendance and grades before the enrollment", async () => {
    prismaMock.enrollment.findFirst.mockResolvedValue({
      id: ENROLLMENT_ID,
      studentId: STUDENT_ID,
    });

    await expect(
      enrollmentMutationResolvers.unenrollStudent(
        null,
        { enrollmentId: ENROLLMENT_ID },
        teacherContext,
      ),
    ).resolves.toBe(true);

    expect(prismaMock.attendanceRecord.deleteMany).toHaveBeenCalledWith({
      where: { enrollmentId: ENROLLMENT_ID },
    });
    expect(prismaMock.enrollment.delete).toHaveBeenCalledWith({ where: { id: ENROLLMENT_ID } });
  });

  it("rejects an enrollment outside the accessible classes", async () => {
    prismaMock.enrollment.findFirst.mockResolvedValue(null);

    await expect(
      enrollmentMutationResolvers.unenrollStudent(
        null,
        { enrollmentId: "missing" },
        teacherContext,
      ),
    ).rejects.toThrow("Not found");
  });
});

describe("enrollmentMutationResolvers.renameStudent", () => {
  it("rejects a blank name", async () => {
    await expect(
      enrollmentMutationResolvers.renameStudent(
        null,
        { enrollmentId: ENROLLMENT_ID, name: " " },
        teacherContext,
      ),
    ).rejects.toThrow("Nome é obrigatório");
  });

  it("trims the new name", async () => {
    prismaMock.enrollment.findFirst.mockResolvedValue({
      id: ENROLLMENT_ID,
      studentId: STUDENT_ID,
    });
    prismaMock.enrollment.findUniqueOrThrow.mockResolvedValue({ id: ENROLLMENT_ID });

    await expect(
      enrollmentMutationResolvers.renameStudent(
        null,
        { enrollmentId: ENROLLMENT_ID, name: "  Bia " },
        teacherContext,
      ),
    ).resolves.toEqual({ id: ENROLLMENT_ID });
    expect(prismaMock.student.update).toHaveBeenCalledWith({
      where: { id: STUDENT_ID },
      data: { name: "Bia" },
    });
  });

  it("rejects an enrollment outside the accessible classes", async () => {
    prismaMock.enrollment.findFirst.mockResolvedValue(null);

    await expect(
      enrollmentMutationResolvers.renameStudent(
        null,
        { enrollmentId: "missing", name: "Bia" },
        teacherContext,
      ),
    ).rejects.toThrow("Not found");
  });
});

describe("enrollmentMutationResolvers.setEnrollmentConcept", () => {
  it("clears the concept when it is null", async () => {
    prismaMock.enrollment.findFirst.mockResolvedValue({ id: ENROLLMENT_ID });
    prismaMock.enrollment.update.mockResolvedValue({ id: ENROLLMENT_ID, concept: null });

    await expect(
      enrollmentMutationResolvers.setEnrollmentConcept(
        null,
        { enrollmentId: ENROLLMENT_ID, concept: null },
        teacherContext,
      ),
    ).resolves.toEqual({ id: ENROLLMENT_ID, concept: null });
  });

  it("rejects an enrollment outside the accessible classes", async () => {
    prismaMock.enrollment.findFirst.mockResolvedValue(null);

    await expect(
      enrollmentMutationResolvers.setEnrollmentConcept(
        null,
        { enrollmentId: "missing", concept: "A" },
        teacherContext,
      ),
    ).rejects.toThrow("Not found");
  });
});
