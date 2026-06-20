import { ClassesPanel } from "@/components/classes-panel";

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">Bem-vindo ao Diário</p>
      <ClassesPanel />
    </div>
  );
}
