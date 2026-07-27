import type { GraphQLContext } from "./context";
import { getPrisma } from "./prisma";

export function ownedOrInvitedWhere(ownerIds: string[]) {
  return { OR: [{ ownerId: { in: ownerIds } }, { invitedUserIds: { hasSome: ownerIds } }] };
}

export function ownerIdsFrom(context: GraphQLContext): string[] {
  const user = context.user;
  const ids: string[] = [];
  if (user?.prismaUserId) {
    ids.push(user.prismaUserId);
  }
  if (user?.id) {
    ids.push(user.id);
  }
  return Array.from(new Set(ids));
}

export function requireOwnerIds(context: GraphQLContext): string[] {
  const ownerIds = ownerIdsFrom(context);
  if (!ownerIds.length) {
    throw new Error("Unauthorized");
  }
  return ownerIds;
}

export async function requireOwnerStrict(classId: string, ownerIds: string[]) {
  const prisma = await getPrisma();
  const classRecord = await prisma.class.findFirst({
    where: { id: classId, ownerId: { in: ownerIds } },
  });
  if (!classRecord) {
    throw new Error("Not found");
  }
  return classRecord;
}

// ponytail: requireOwnedOrInvited unifies owner + invited check. If invite-only
// access becomes a security concern, split into separate lookup.
export async function requireOwnedOrInvited(classId: string, ownerIds: string[]) {
  const prisma = await getPrisma();
  const classRecord = await prisma.class.findFirst({
    where: { id: classId, ...ownedOrInvitedWhere(ownerIds) },
  });
  if (!classRecord) {
    throw new Error("Not found");
  }
  return classRecord;
}
