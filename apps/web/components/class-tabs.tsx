"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ClassTabs({ classId }: { classId: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/classes/${classId}`, label: "Alunos" },
    { href: `/classes/${classId}/evaluations`, label: "Avaliações" },
    { href: `/classes/${classId}/grades`, label: "Notas" },
    { href: `/classes/${classId}/attendance`, label: "Presenças" },
    { href: `/classes/${classId}/config`, label: "Config" },
  ];
  return (
    <div className="border-b overflow-x-auto scroll-area">
      <nav className="-mb-px flex gap-4 whitespace-nowrap pr-2">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-2 py-2 border-b-2 ${active ? "border-foreground font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
