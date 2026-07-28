import { describe, expect, it, vi } from "vitest";

const getServerSession = vi.hoisted(() => vi.fn());

vi.mock("next-auth/next", () => ({ getServerSession }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: { providers: [] } }));

describe("createGraphQLContext", () => {
  it("maps NextAuth session user into GraphQL context", async () => {
    const user = { id: "next-1", prismaUserId: "prisma-1", email: "a@example.com" };
    getServerSession.mockResolvedValueOnce({ user });

    const { createGraphQLContext } = await import("./context");

    await expect(createGraphQLContext()).resolves.toEqual({ user });
  });

  it("returns null user without session", async () => {
    getServerSession.mockResolvedValueOnce(null);

    const { createGraphQLContext } = await import("./context");

    await expect(createGraphQLContext()).resolves.toEqual({ user: null });
  });
});
