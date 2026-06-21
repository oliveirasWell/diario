"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { HeaderTitle } from "@/components/header-title";
import { HeaderSettings } from "@/components/header-settings";

export function Header() {
  const { status } = useSession();
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-30 w-full bg-muted/30">
      <div className="mx-auto flex h-16 max-w-full items-center justify-between px-3 sm:max-w-6xl sm:px-6">
        <HeaderTitle />
        {status !== "unauthenticated" ? <HeaderSettings /> : null}
      </div>
    </header>
  );
}
