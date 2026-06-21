import { queryOptions } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import type { Class, Enrollment, Evaluation, Grade } from "@/src/gql/schema-types";

export type AttendanceRecord = {
  id: string;
  enrollmentId: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  session: { id: string; date: string };
};

export const queryKeys = {
  classes: () => ["classes"] as const,
  class: (classId: string) => ["class", classId] as const,
  enrollments: (classId: string) => ["enrollments", classId] as const,
  attendanceDates: (classId: string, from?: string, to?: string) =>
    ["attendanceDates", classId, from, to] as const,
  attendanceRecords: (classId: string) => ["attendanceRecords", classId] as const,
  evaluations: (classId: string) => ["evaluations", classId] as const,
  grades: (classId: string) => ["grades", classId] as const,
};

export function classesQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.classes(),
    queryFn: async () => {
      const data = await gqlRequest<{ classes: Class[] }>(/* GraphQL */ `
        query Classes {
          classes { id name year ownerId }
        }
      `);
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
      const res = await gqlRequest<{
        class: {
          id: string;
          name: string;
          daysOfWeek: number[];
          startDate?: string | null;
          endDate?: string | null;
        };
      }>(/* GraphQL */ `
        query Class($id: ID!) { class(id: $id) { id name daysOfWeek startDate endDate } }
      `, { id: classId });
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
      const data = await gqlRequest<{ enrollments: Enrollment[] }>(/* GraphQL */ `
        query Enrollments($classId: ID!) {
          enrollments(classId: $classId) {
            id
            concept
            student { id name email }
          }
        }
      `, { classId });
      return data.enrollments;
    },
    enabled: !!classId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function attendanceDatesQueryOptions(classId: string, from?: string, to?: string) {
  return queryOptions({
    queryKey: queryKeys.attendanceDates(classId, from, to),
    queryFn: async () => {
      const data = await gqlRequest<{ attendanceDates: string[] }>(/* GraphQL */ `
        query AttendanceDates($classId: ID!, $from: DateTime, $to: DateTime) {
          attendanceDates(classId: $classId, from: $from, to: $to)
        }
      `, { classId, from, to });
      return data.attendanceDates.map((d) => new Date(d));
    },
    enabled: !!classId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function attendanceRecordsQueryOptions(classId: string, from?: string, to?: string) {
  return queryOptions({
    queryKey: queryKeys.attendanceRecords(classId),
    queryFn: async () => {
      const data = await gqlRequest<{ attendanceRecords: AttendanceRecord[] }>(/* GraphQL */ `
        query AttendanceRecords($classId: ID!, $from: DateTime, $to: DateTime) {
          attendanceRecords(classId: $classId, from: $from, to: $to) {
            id enrollmentId status session { id date }
          }
        }
      `, { classId, from, to });
      return data.attendanceRecords;
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
      const data = await gqlRequest<{ evaluations: Evaluation[] }>(/* GraphQL */ `
        query Evaluations($classId: ID!) {
          evaluations(classId: $classId) { id classId title weight maxScore createdAt }
        }
      `, { classId });
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
      const data = await gqlRequest<{ gradesByClass: Grade[] }>(/* GraphQL */ `
        query GradesByClass($classId: ID!) {
          gradesByClass(classId: $classId) { id enrollmentId evaluationId score }
        }
      `, { classId });
      return data.gradesByClass;
    },
    enabled: !!classId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
