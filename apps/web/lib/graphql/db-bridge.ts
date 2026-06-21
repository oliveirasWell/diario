import type { AttendanceStatus as GqlAttendanceStatus } from "@/src/gql/schema";
import { AttendanceStatus as PrismaAttendanceStatus } from "@diario/db";

export { PrismaAttendanceStatus };

/** GraphQL e Prisma usam os mesmos valores wire (PRESENT/ABSENT/LATE). */
export function toPrismaAttendanceStatus(status: GqlAttendanceStatus): PrismaAttendanceStatus {
  return status as PrismaAttendanceStatus;
}
