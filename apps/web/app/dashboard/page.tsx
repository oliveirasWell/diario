import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">Bem-vindo ao Diário</p>
      <div>
        <Link className="underline" href="/classes">Ir para Turmas</Link>
      </div>
    </div>
  );
}
