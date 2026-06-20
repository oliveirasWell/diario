"use client";

import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { status } = useSession();

  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6 text-center">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <Button onClick={() => signIn("google", { callbackUrl })}>
          Entrar com Google
        </Button>
      </div>
    </div>
  );
}
