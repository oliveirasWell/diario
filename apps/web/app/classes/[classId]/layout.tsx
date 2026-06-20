import Link from "next/link";

export default async function ClassLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  // Fetch class name server-side using Prisma
  const [{ prisma }, { getServerSession }, { authOptions }] = await Promise.all([
    import("@diario/db"),
    import("next-auth/next"),
    import("@/app/api/auth/[...nextauth]/route"),
  ]);
  const session = await getServerSession(authOptions as any);
  let className: string | null = null;
  if (session?.user?.prismaUserId) {
    const c = await prisma.class.findFirst({ where: { id: classId as string, ownerId: session.user.prismaUserId as string } });
    className = c?.name ?? null;
  }

  const tabs = [
    { href: `/classes/${classId}`, label: "Alunos" },
    { href: `/classes/${classId}/evaluations`, label: "Avaliações" },
    { href: `/classes/${classId}/grades`, label: "Notas" },
    { href: `/classes/${classId}/attendance`, label: "Presenças" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/classes" className="underline">Turmas</Link>
        <span>/</span>
        <span className="text-foreground">{className || classId}</span>
      </div>
      <div className="border-b">
        <nav className="-mb-px flex gap-4">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="px-2 py-2 border-b-2 border-transparent hover:text-foreground"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      <div>{children}</div>
    </div>
  );
}
