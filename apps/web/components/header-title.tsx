"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { gqlRequest } from "@/lib/graphql-client";
import { useEffect, useState } from "react";

export function HeaderTitle() {
  const pathname = usePathname();
  const params = useParams();
  const [className, setClassName] = useState<string>("");
  const inClassesIndex = pathname === "/classes";
  const inClassDetail = pathname?.startsWith("/classes/") && typeof params?.classId === "string";

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (inClassDetail) {
        try {
          const data = await gqlRequest<{ class: { id: string; name: string } }>(/* GraphQL */`
            query HdrClass($id: ID!) { class(id: $id) { id name } }
          `, { id: params!.classId as string });
          if (!ignore) setClassName(data.class?.name ?? (params!.classId as string));
        } catch {
          if (!ignore) setClassName(params!.classId as string);
        }
      } else {
        setClassName("");
      }
    }
    run();
    return () => { ignore = true; };
  }, [inClassDetail, params]);

  if (inClassesIndex) {
    return <div className="font-medium truncate text-sm sm:text-base">Turmas</div>;
  }
  if (inClassDetail) {
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
