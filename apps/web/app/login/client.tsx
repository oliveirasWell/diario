"use client";

import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { GoogleIcon } from "./google-icon";

export function LoginClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { status } = useSession();

  const callbackUrl = params.get("callbackUrl") || "/classes";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/classes");
    }
  }, [status, router]);

  return (
    <div className="relative z-10 row-start-2 flex min-h-[35svh] items-center justify-center bg-background p-8 shadow-2xl md:col-start-2 md:row-auto md:min-h-screen md:p-6 md:shadow-none">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Web Diário</h1>
          <p className="text-sm text-muted-foreground">Entre para acessar suas turmas.</p>
        </div>
        <Button className="h-12 px-6 text-base" onClick={() => signIn("google", { callbackUrl })}>
          <GoogleIcon />
          Entrar com Google
        </Button>
      </div>
    </div>
  );
}
