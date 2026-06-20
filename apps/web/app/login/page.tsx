import { Suspense } from "react";
import { LoginClient } from "./client";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-muted-foreground">Carregando…</div>}>
      <LoginClient />
    </Suspense>
  );
}
