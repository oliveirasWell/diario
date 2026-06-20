"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6 text-center">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <Button onClick={() => signIn("google")}>Entrar com Google</Button>
      </div>
    </div>
  );
}
