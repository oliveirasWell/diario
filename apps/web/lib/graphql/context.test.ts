import { afterEach, describe, expect, it, vi } from "vitest";
import { E2E_BYPASS_USER_EMAIL } from "@/lib/auth/e2e-bypass";
import { prismaMock } from "@/test/prisma-mock";

const getServerSession = vi.hoisted(() => vi.fn());

vi.mock("next-auth/next", () => ({ getServerSession }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: { providers: [] } }));

describe("createGraphQLContext", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("maps NextAuth session user into GraphQL context", async () => {
    const user = { id: "next-1", prismaUserId: "prisma-1", email: "a@example.com" };
    getServerSession.mockResolvedValueOnce({ user });

    const { createGraphQLContext } = await import("./context");

    await expect(createGraphQLContext()).resolves.toEqual({ user });
  });

  it("returns null user without session", async () => {
    vi.stubEnv("E2E_AUTH_BYPASS", "0");
    getServerSession.mockResolvedValueOnce(null);

    const { createGraphQLContext } = await import("./context");

    await expect(createGraphQLContext()).resolves.toEqual({ user: null });
  });

  it("uses a local bypass user when e2e auth bypass is on and there is no session", async () => {
    vi.stubEnv("E2E_AUTH_BYPASS", "1");
    getServerSession.mockResolvedValueOnce(null);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "e2e-user",
      email: E2E_BYPASS_USER_EMAIL,
    });

    const { createGraphQLContext } = await import("./context");

    await expect(createGraphQLContext()).resolves.toEqual({
      user: { id: "e2e-user", prismaUserId: "e2e-user", email: E2E_BYPASS_USER_EMAIL },
    });
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { email: E2E_BYPASS_USER_EMAIL, name: "E2E" },
    });
  });

  it("reuses the local bypass user when it already exists", async () => {
    vi.stubEnv("E2E_AUTH_BYPASS", "1");
    getServerSession.mockResolvedValueOnce(null);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "e2e-user",
      email: E2E_BYPASS_USER_EMAIL,
    });

    const { createGraphQLContext } = await import("./context");

    await expect(createGraphQLContext()).resolves.toEqual({
      user: { id: "e2e-user", prismaUserId: "e2e-user", email: E2E_BYPASS_USER_EMAIL },
    });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});
