import { ClassTabs } from "@/components/class-tabs";

export default async function ClassLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <ClassTabs classId={classId} />
      <div>{children}</div>
    </div>
  );
}
