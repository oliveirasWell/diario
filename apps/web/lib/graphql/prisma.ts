export async function getPrisma() {
  const { prisma } = await import("@diario/db");
  return prisma;
}
