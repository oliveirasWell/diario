import { beforeEach, describe, expect, it, vi } from "vitest";

const userUpsert = vi.hoisted(() => vi.fn());

vi.mock("next-auth", () => ({
  default: vi.fn(() => vi.fn()),
}));
vi.mock("next-auth/providers/google", () => ({
  default: vi.fn((config) => ({ id: "google", ...config })),
}));
vi.mock("@next-auth/mongodb-adapter", () => ({
  MongoDBAdapter: vi.fn(() => ({})),
}));
vi.mock("@/lib/mongodb", () => ({
  default: vi.fn(() => Promise.resolve({})),
}));
vi.mock("@diario/db", () => ({
  prisma: {
    user: {
      upsert: userUpsert,
    },
  },
}));

describe("NextAuth callbacks", () => {
  beforeEach(() => {
    userUpsert.mockReset();
    process.env.GOOGLE_CLIENT_ID = "test-client";
    process.env.GOOGLE_CLIENT_SECRET = "test-secret";
  });

  it("stores prisma user id in JWT", async () => {
    userUpsert.mockResolvedValueOnce({ id: "prisma-1" });
    const { authOptions } = await import("./route");

    const token = await authOptions.callbacks!.jwt!({
      token: { email: "a@example.com" },
      user: { email: "a@example.com", name: "Ana", image: "avatar.png" } as any,
    } as any);

    expect(token.prismaUserId).toBe("prisma-1");
    expect(userUpsert).toHaveBeenCalledWith({
      where: { email: "a@example.com" },
      update: { name: "Ana", image: "avatar.png" },
      create: { email: "a@example.com", name: "Ana", image: "avatar.png" },
    });
  });

  it("keeps auth working when prisma sync fails", async () => {
    userUpsert.mockRejectedValueOnce(new Error("db down"));
    const { authOptions } = await import("./route");

    const token = await authOptions.callbacks!.jwt!({
      token: { email: "a@example.com" },
      user: { email: "a@example.com" } as any,
    } as any);

    expect(token).toEqual({ email: "a@example.com" });
  });

  it("copies auth ids into session", async () => {
    const { authOptions } = await import("./route");

    const session = await authOptions.callbacks!.session!({
      session: { user: { email: "a@example.com" } },
      token: { sub: "next-1", prismaUserId: "prisma-1" },
    } as any);

    expect(session.user).toMatchObject({ id: "next-1", prismaUserId: "prisma-1" });
  });

  it("keeps sessions without user untouched", async () => {
    const { authOptions } = await import("./route");

    const session = await authOptions.callbacks!.session!({
      session: {},
      token: {},
    } as any);

    expect(session).toEqual({});
  });
});
