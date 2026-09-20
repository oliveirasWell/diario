"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CLASSES_PATH, MAPA_PATH, MAP_COPY } from "@/lib/mapa/constants";
import { classQueryOptions } from "@/lib/query-options";
import { cn } from "@/lib/utils";

const navClassName = (active: boolean) =>
  cn("text-sm sm:text-base", active ? "font-medium" : "underline underline-offset-2");

export const HeaderTitle = () => {
  const pathname = usePathname();
  const params = useParams();
  const classId = typeof params?.classId === "string" ? params.classId : "";
  const inClassesIndex = pathname === CLASSES_PATH;
  const inClassDetail = pathname?.startsWith(`${CLASSES_PATH}/`) && !!classId;
  const inMapa = pathname === MAPA_PATH;

  const { data: classData } = useQuery({
    ...classQueryOptions(classId),
    enabled: inClassDetail,
  });

  return (
    <div className="flex min-w-0 items-center gap-3">
      <nav className="flex items-center gap-3">
        <Link href={CLASSES_PATH} className={navClassName(inClassesIndex || inClassDetail)}>
          {MAP_COPY.navTurmas}
        </Link>
        <Link href={MAPA_PATH} className={navClassName(inMapa)}>
          {MAP_COPY.navMapa}
        </Link>
      </nav>
      {inClassDetail ? (
        <>
          <span>/</span>
          <span className="truncate font-semibold text-base sm:text-lg max-w-[50vw] sm:max-w-none">
            {classData?.name ?? classId}
          </span>
        </>
      ) : null}
    </div>
  );
};
