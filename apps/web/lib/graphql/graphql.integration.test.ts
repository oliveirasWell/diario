import { createYoga } from "graphql-yoga";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGraphQLSchema } from "./create-schema";

const prisma = vi.hoisted(() => ({
  class: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock("@diario/db", () => ({ prisma }));

function yoga(user: unknown) {
  return createYoga({
    schema: createGraphQLSchema(),
    graphqlEndpoint: "/api/graphql",
    context: () => ({ user }),
    maskedErrors: false,
  });
}

async function postGraphQL(source: string, variables = {}, user: unknown = null) {
  const res = await yoga(user).handleRequest(
    new Request("http://test.local/api/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: source, variables }),
    }),
    {},
  );
  return res.json();
}

describe("GraphQL integration", () => {
  beforeEach(() => {
    prisma.class.create.mockReset();
    prisma.class.findMany.mockReset();
  });

  it("rejects authenticated-only mutations without NextAuth user", async () => {
    const body = await postGraphQL(`mutation { createClass(name: "Math", year: 2026) { id } }`);

    expect(body.errors?.[0]?.message).toBe("Unauthorized");
  });

  it("creates class for prisma user", async () => {
    prisma.class.create.mockResolvedValueOnce({
      id: "class-1",
      name: "Math",
      year: 2026,
      ownerId: "u1",
    });

    const body = await postGraphQL(
      `mutation { createClass(name: "Math", year: 2026) { id name ownerId } }`,
      {},
      { prismaUserId: "u1" },
    );

    expect(body.data.createClass).toEqual({ id: "class-1", name: "Math", ownerId: "u1" });
    expect(prisma.class.create).toHaveBeenCalledWith({
      data: {
        name: "Math",
        year: 2026,
        ownerId: "u1",
        daysOfWeek: [],
        startDate: null,
        endDate: null,
      },
    });
  });

  it("lists classes visible to auth ids", async () => {
    prisma.class.findMany.mockResolvedValueOnce([
      { id: "class-1", name: "Math", year: 2026, ownerId: "u1" },
    ]);

    const body = await postGraphQL(
      `query { classes { id name } }`,
      {},
      { id: "next-1", prismaUserId: "u1" },
    );

    expect(body.data.classes).toEqual([{ id: "class-1", name: "Math" }]);
    expect(prisma.class.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { ownerId: { in: ["u1", "next-1"] } },
          { invitedUserIds: { hasSome: ["u1", "next-1"] } },
        ],
      },
    });
  });
});
