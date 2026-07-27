import { createYoga } from "graphql-yoga";
import { describe, expect, it } from "vitest";
import { TEACHER_NEXT_AUTH_ID, TEACHER_OWNER_IDS, TEACHER_PRISMA_ID } from "@/test/graphql-context";
import { prismaMock } from "@/test/prisma-mock";
import { createGraphQLSchema } from "./create-schema";

const CLASS_ID = "class-1";

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

    const body = await postGraphQL(
      `query { classes { id name } }`,
      {},
      {
        id: TEACHER_NEXT_AUTH_ID,
        prismaUserId: TEACHER_PRISMA_ID,
      },
    );

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
});
