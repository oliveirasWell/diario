import { queryOptions } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import {
  AttendanceBoardDocument,
  ClassDocument,
  ClassesDocument,
  EnrollmentsDocument,
  EvaluationsDocument,
  GradesByClassDocument,
} from "@/src/gql/graphql";
import type { AttendanceBoardQuery } from "@/src/gql/graphql";

export type AttendanceRecord = AttendanceBoardQuery["attendanceRecords"][number];
export type AttendanceBoardEnrollment = AttendanceBoardQuery["enrollments"][number];
export type AttendanceBoard = {
  attendanceDates: Date[];
  enrollments: AttendanceBoardEnrollment[];
  attendanceRecords: AttendanceRecord[];
};

export const queryKeys = {
  classes: () => ["classes"] as const,
  class: (classId: string) => ["class", classId] as const,
  enrollments: (classId: string) => ["enrollments", classId] as const,
  attendanceBoard: (classId: string, from?: string, to?: string) =>
    ["attendanceBoard", classId, from, to] as const,
  evaluations: (classId: string) => ["evaluations", classId] as const,
  grades: (classId: string) => ["grades", classId] as const,
};

export function classesQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.classes(),
    queryFn: async () => {
      const data = await gqlRequest(ClassesDocument);
      return data.classes;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function classQueryOptions(classId: string) {
  return queryOptions({
    queryKey: queryKeys.class(classId),
    queryFn: async () => {
      const res = await gqlRequest(ClassDocument, { id: classId });
      return res.class;
    },
    enabled: !!classId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function enrollmentsQueryOptions(classId: string) {
  return queryOptions({
    queryKey: queryKeys.enrollments(classId),
    queryFn: async () => {
      const data = await gqlRequest(EnrollmentsDocument, { classId });
      return data.enrollments;
    },
    enabled: !!classId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function attendanceBoardQueryOptions(classId: string, from?: string, to?: string) {
  return queryOptions({
    queryKey: queryKeys.attendanceBoard(classId, from, to),
    queryFn: async (): Promise<AttendanceBoard> => {
      const data = await gqlRequest(AttendanceBoardDocument, { classId, from, to });
      return {
        attendanceDates: data.attendanceDates.map((date) => new Date(date)),
        enrollments: data.enrollments,
        attendanceRecords: data.attendanceRecords,
      };
    },
    enabled: !!classId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function evaluationsQueryOptions(classId: string) {
  return queryOptions({
    queryKey: queryKeys.evaluations(classId),
    queryFn: async () => {
      const data = await gqlRequest(EvaluationsDocument, { classId });
      return data.evaluations;
    },
    enabled: !!classId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function gradesQueryOptions(classId: string) {
  return queryOptions({
    queryKey: queryKeys.grades(classId),
    queryFn: async () => {
      const data = await gqlRequest(GradesByClassDocument, { classId });
      return data.gradesByClass;
    },
    enabled: !!classId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
