import type { GraphQLContext } from "./context";
import { getPrisma } from "./prisma";

export function ownerIdsFrom(ctx: GraphQLContext): string[] {
  const ids: string[] = [];
  const u = ctx.user;
  if (u?.prismaUserId) {
    ids.push(u.prismaUserId);
  }
  if (u?.id) {
    ids.push(u.id);
  }
  return Array.from(new Set(ids));
}

export function requireOwnerIds(ctx: GraphQLContext): string[] {
  const ownerIds = ownerIdsFrom(ctx);
  if (!ownerIds.length) {
    throw new Error("Unauthorized");
  }
  return ownerIds;
}

export async function requireOwnedClass(classId: string, ownerIds: string[]) {
  const prisma = await getPrisma();
  const c = await prisma.class.findFirst({
    where: { id: classId, ownerId: { in: ownerIds } },
  });
  if (!c) {
    throw new Error("Not found");
  }
  return c;
}

export async function requireOwnerStrict(classId: string, ownerIds: string[]) {
  const prisma = await getPrisma();
  const c = await prisma.class.findFirst({
    where: { id: classId, ownerId: { in: ownerIds } },
  });
  if (!c) {
    throw new Error("Not found");
  }
  return c;
}

// ponytail: requireOwnedOrInvited unifies owner + invited check. If invite-only
// access becomes a security concern, split into separate lookup.
export async function requireOwnedOrInvited(classId: string, ownerIds: string[]) {
  const prisma = await getPrisma();
  const c = await prisma.class.findFirst({
    where: {
      id: classId,
      OR: [{ ownerId: { in: ownerIds } }, { invitedUserIds: { hasSome: ownerIds } }],
    },
  });
  if (!c) {
    throw new Error("Not found");
  }
  return c;
}

// ponytail: reusable where clause for queries filtering by class access.
// Relation filters like `class: { ownerId: ... }` don't support OR,
// so this flips the pattern: check class first, then filter by classId.
export async function firstAccessibleClassId(classId: string, ownerIds: string[]) {
  const prisma = await getPrisma();
  const c = await prisma.class.findFirst({
    where: {
      id: classId,
      OR: [{ ownerId: { in: ownerIds } }, { invitedUserIds: { hasSome: ownerIds } }],
    },
    select: { id: true },
  });
  return c?.id ?? null;
}
