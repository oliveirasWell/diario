import { describe, expect, it, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { authOptions } from "./route";

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
vi.mock("@diario/db", () => ({ prisma: prismaMock }));

const EMAIL = "a@example.com";
const PRISMA_USER_ID = "prisma-1";

describe("NextAuth callbacks", () => {
  it("stores prisma user id in JWT", async () => {
    prismaMock.user.upsert.mockResolvedValue({ id: PRISMA_USER_ID });

    const token = await authOptions.callbacks!.jwt!({
      token: { email: EMAIL },
      user: { email: EMAIL, name: "Ana", image: "avatar.png" } as any,
    } as any);

    expect(token.prismaUserId).toBe(PRISMA_USER_ID);
    expect(prismaMock.user.upsert).toHaveBeenCalledWith({
      where: { email: EMAIL },
      update: { name: "Ana", image: "avatar.png" },
      create: { email: EMAIL, name: "Ana", image: "avatar.png" },
    });
  });

  it("keeps auth working when prisma sync fails", async () => {
    prismaMock.user.upsert.mockRejectedValue(new Error("db down"));

    const token = await authOptions.callbacks!.jwt!({
      token: { email: EMAIL },
      user: { email: EMAIL } as any,
    } as any);

    expect(token).toEqual({ email: EMAIL });
  });

  it("copies auth ids into session", async () => {
    const session = await authOptions.callbacks!.session!({
      session: { user: { email: EMAIL } },
      token: { sub: "next-1", prismaUserId: PRISMA_USER_ID },
    } as any);

    expect(session.user).toMatchObject({ id: "next-1", prismaUserId: PRISMA_USER_ID });
  });

  it("keeps sessions without user untouched", async () => {
    const session = await authOptions.callbacks!.session!({
      session: {},
      token: {},
    } as any);

    expect(session).toEqual({});
  });
});
