"use client";

import { StudentsPanel } from "@/components/students-panel";
import { useParams } from "next/navigation";

export default function ClassStudentsPage() {
  const params = useParams();
  const classId = params?.classId as string;
  return (
    <StudentsPanel classId={classId} />
  );
}
