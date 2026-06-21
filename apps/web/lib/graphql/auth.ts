import type { GraphQLContext } from "./context";
import { getPrisma } from "./prisma";

export function ownerIdsFrom(ctx: GraphQLContext): string[] {
  const ids: string[] = [];
  const u = ctx.user;
  if (u?.prismaUserId) ids.push(u.prismaUserId);
  if (u?.id) ids.push(u.id);
  return Array.from(new Set(ids));
}

export function requireOwnerIds(ctx: GraphQLContext): string[] {
  const ownerIds = ownerIdsFrom(ctx);
  if (!ownerIds.length) throw new Error("Unauthorized");
  return ownerIds;
}

export async function requireOwnedClass(classId: string, ownerIds: string[]) {
  const prisma = await getPrisma();
  const c = await prisma.class.findFirst({
    where: { id: classId, ownerId: { in: ownerIds } },
  });
  if (!c) throw new Error("Not found");
  return c;
}
