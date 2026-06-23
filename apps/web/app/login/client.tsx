"use client";

import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6 text-center">
        <Button onClick={() => signIn("google", { callbackUrl })}>Entrar com Google</Button>
      </div>
    </div>
  );
}
