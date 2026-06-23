"use client";

import { signOut, useSession } from "next-auth/react";
import { Laptop, LogOut, Moon, Settings, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemeMode, type ThemeMode } from "@/hooks/use-theme";
import pkg from "../package.json";

export function HeaderSettings() {
  const { data: session } = useSession();
  const { mode, setMode } = useThemeMode();
  const email = session?.user?.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Configurações" />}
      >
        <Settings className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {email ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate font-normal text-foreground">
                {email}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuRadioGroup value={mode} onValueChange={(v) => setMode(v as ThemeMode)}>
          <DropdownMenuLabel>Tema</DropdownMenuLabel>
          <DropdownMenuRadioItem value="system">
            <Laptop className="size-4" />
            Sistema
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">
            <Sun className="size-4" />
            Claro
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="size-4" />
            Escuro
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-muted-foreground">
          Versão {pkg.version}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
