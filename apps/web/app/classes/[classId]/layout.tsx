import Link from "next/link";

export default function ClassLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { classId: string };
}) {
  const { classId } = params;
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
        <span className="text-foreground">{classId}</span>
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
      </div>
      <div>{children}</div>
    </div>
  );
}
