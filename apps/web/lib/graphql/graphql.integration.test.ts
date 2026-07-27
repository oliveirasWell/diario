import { createYoga } from "graphql-yoga";
import { describe, expect, it } from "vitest";
import { TEACHER_NEXT_AUTH_ID, TEACHER_OWNER_IDS, TEACHER_PRISMA_ID } from "@/test/graphql-context";
import { prismaMock } from "@/test/prisma-mock";
import { createGraphQLSchema } from "./create-schema";

const CLASS_ID = "class-1";
const ENROLLMENT_ID = "enrollment-1";
const SESSION_ID = "session-1";
const teacher = { id: TEACHER_NEXT_AUTH_ID, prismaUserId: TEACHER_PRISMA_ID };

async function postGraphQL(source: string, variables = {}, user: unknown = null) {
  const yoga = createYoga({
    schema: createGraphQLSchema(),
    graphqlEndpoint: "/api/graphql",
    context: () => ({ user }),
    maskedErrors: false,
  });
  const response = await yoga.handleRequest(
    new Request("http://test.local/api/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: source, variables }),
    }),
    {},
  );
  return response.json();
}

describe("GraphQL integration", () => {
  it("rejects authenticated-only mutations without NextAuth user", async () => {
    const body = await postGraphQL(`mutation { createClass(name: "Math", year: 2026) { id } }`);

    expect(body.errors?.[0]?.message).toBe("Unauthorized");
  });

  it("creates class for prisma user", async () => {
    prismaMock.class.create.mockResolvedValue({
      id: CLASS_ID,
      name: "Math",
      year: 2026,
      ownerId: TEACHER_PRISMA_ID,
    });

    const body = await postGraphQL(
      `mutation { createClass(name: "Math", year: 2026) { id name ownerId } }`,
      {},
      { prismaUserId: TEACHER_PRISMA_ID },
    );

    expect(body.data.createClass).toEqual({
      id: CLASS_ID,
      name: "Math",
      ownerId: TEACHER_PRISMA_ID,
    });
    expect(prismaMock.class.create).toHaveBeenCalledWith({
      data: {
        name: "Math",
        year: 2026,
        ownerId: TEACHER_PRISMA_ID,
        daysOfWeek: [],
        startDate: null,
        endDate: null,
      },
    });
  });

  it("lists classes visible to auth ids", async () => {
    prismaMock.class.findMany.mockResolvedValue([
      { id: CLASS_ID, name: "Math", year: 2026, ownerId: TEACHER_PRISMA_ID },
    ]);

    const body = await postGraphQL(`query { classes { id name } }`, {}, teacher);

    expect(body.data.classes).toEqual([{ id: CLASS_ID, name: "Math" }]);
    expect(prismaMock.class.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { ownerId: { in: TEACHER_OWNER_IDS } },
          { invitedUserIds: { hasSome: TEACHER_OWNER_IDS } },
        ],
      },
    });
  });

  it("loads dates, students and records in a single response", async () => {
    prismaMock.class.findFirst.mockResolvedValue({
      id: CLASS_ID,
      daysOfWeek: [1],
      startDate: new Date("2026-01-05T00:00:00.000Z"),
      endDate: new Date("2026-01-05T00:00:00.000Z"),
    });
    prismaMock.enrollment.findMany.mockResolvedValue([
      { id: ENROLLMENT_ID, student: { id: "student-1", name: "Ana" } },
    ]);
    prismaMock.attendanceSession.findMany.mockResolvedValue([
      {
        id: SESSION_ID,
        date: new Date("2026-01-05T12:00:00.000Z"),
        records: [{ id: "record-1", enrollmentId: ENROLLMENT_ID, status: "PRESENT" }],
      },
    ]);

    const body = await postGraphQL(
      `query AttendanceBoard($classId: ID!) {
        attendanceDates(classId: $classId)
        enrollments(classId: $classId) { id student { id name } }
        attendanceRecords(classId: $classId) {
          id enrollmentId status session { id date }
        }
      }`,
      { classId: CLASS_ID },
      teacher,
    );

    expect(body.data).toEqual({
      attendanceDates: ["2026-01-05T00:00:00.000Z"],
      enrollments: [{ id: ENROLLMENT_ID, student: { id: "student-1", name: "Ana" } }],
      attendanceRecords: [
        {
          id: "record-1",
          enrollmentId: ENROLLMENT_ID,
          status: "PRESENT",
          session: { id: SESSION_ID, date: "2026-01-05T12:00:00.000Z" },
        },
      ],
    });
  });
});
