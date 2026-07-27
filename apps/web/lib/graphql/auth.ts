import type { GraphQLContext } from "./context";
import { getPrisma } from "./prisma";
import { createGraphQLError } from "graphql-yoga";

export const ownedOrInvitedWhere = (ownerIds: string[]) => {
  return { OR: [{ ownerId: { in: ownerIds } }, { invitedUserIds: { hasSome: ownerIds } }] };
};

export const ownerIdsFrom = (context: GraphQLContext): string[] => {
  const user = context.user;
  const ids: string[] = [];
  if (user?.prismaUserId) {
    ids.push(user.prismaUserId);
  }
  if (user?.id) {
    ids.push(user.id);
  }
  return Array.from(new Set(ids));
};

export const requireOwnerIds = (context: GraphQLContext): string[] => {
  const ownerIds = ownerIdsFrom(context);
  if (!ownerIds.length) {
    throw createGraphQLError("Unauthorized");
  }
  return ownerIds;
};

export const requireOwnerStrict = async (classId: string, ownerIds: string[]) => {
  const prisma = await getPrisma();
  const classRecord = await prisma.class.findFirst({
    where: { id: classId, ownerId: { in: ownerIds } },
  });
  if (!classRecord) {
    throw createGraphQLError("Not found");
  }
  return classRecord;
};

// ponytail: requireOwnedOrInvited unifies owner + invited check. If invite-only
// access becomes a security concern, split into separate lookup.
export const requireOwnedOrInvited = async (classId: string, ownerIds: string[]) => {
  const prisma = await getPrisma();
  const classRecord = await prisma.class.findFirst({
    where: { id: classId, ...ownedOrInvitedWhere(ownerIds) },
  });
  if (!classRecord) {
    throw createGraphQLError("Not found");
  }
  return classRecord;
};
