"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { classQueryOptions } from "@/lib/query-options";

export function HeaderTitle() {
  const pathname = usePathname();
  const params = useParams();
  const classId = typeof params?.classId === "string" ? params.classId : "";
  const inClassesIndex = pathname === "/classes";
  const inClassDetail = pathname?.startsWith("/classes/") && !!classId;

  const { data: classData } = useQuery({
    ...classQueryOptions(classId),
    enabled: inClassDetail,
  });

  if (inClassesIndex) {
    return <div className="font-medium truncate text-sm sm:text-base">Turmas</div>;
  }

  if (inClassDetail) {
    const className = classData?.name ?? classId;
    return (
      <div className="font-semibold truncate text-base sm:text-lg flex items-center gap-1.5">
        <Link href="/classes" className="underline underline-offset-2">Turmas</Link>
        <span>/</span>
        <span className="truncate max-w-[60vw] sm:max-w-none">{className}</span>
      </div>
    );
  }

  return null;
}
