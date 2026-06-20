"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Header() {
  const { status } = useSession();
  const pathname = usePathname();

  // Hide on login page
  if (pathname === "/login") return null;

  return (
    <header className="w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="font-semibold">Diário</div>
        {status === "authenticated" ? (
          <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/login" })}>
            Sair
          </Button>
        ) : null}
      </div>
    </header>
  );
}
