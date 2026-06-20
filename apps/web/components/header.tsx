"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HeaderTitle } from "@/components/header-title";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut } from "lucide-react";

export function Header() {
  const { status } = useSession();
  const pathname = usePathname();

  // Hide on login page
  if (pathname === "/login") return null;

  return (
    <header className="w-full bg-muted/30 sticky top-0 z-30">
      <div className="mx-auto max-w-full sm:max-w-6xl px-3 sm:px-6 h-16 flex items-center justify-between">
        <HeaderTitle />
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {status !== "unauthenticated" ? (
            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => signOut({ callbackUrl: "/login" })} title="Sair" aria-label="Sair">
              <LogOut className="size-5" />
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
