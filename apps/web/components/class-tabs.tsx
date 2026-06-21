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
    <div className="overflow-x-auto">
      <nav className="flex gap-1 whitespace-nowrap">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-3 py-2 ${active ? "bg-muted text-foreground font-normal" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
