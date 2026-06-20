"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";

const schema = z.object({
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ClassConfigPage() {
  const params = useParams();
  const classId = params?.classId as string;
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      const res = await gqlRequest<{ class: { id: string; name: string; daysOfWeek: number[]; startDate?: string | null; endDate?: string | null } }>(
        /* GraphQL */ `
        query Class($id: ID!) { class(id: $id) { id name daysOfWeek startDate endDate } }
      `,
        { id: classId }
      );
      return res.class;
    },
    enabled: !!classId,
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await gqlRequest<{ updateClassSchedule: { id: string } }>(/* GraphQL */ `
        mutation UpdateClassSchedule($id: ID!, $daysOfWeek: [Int!], $startDate: DateTime, $endDate: DateTime) {
          updateClassSchedule(id: $id, daysOfWeek: $daysOfWeek, startDate: $startDate, endDate: $endDate) { id }
        }
      `, { id: classId, ...values });
      return res.updateClassSchedule;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class", classId] });
      qc.invalidateQueries({ queryKey: ["attendanceDates", classId] });
    },
  });

  const { register, handleSubmit, setValue, watch, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { daysOfWeek: [], startDate: undefined, endDate: undefined },
  });

  useEffect(() => {
    if (!data) return;
    const toDateOnly = (s?: string | null) => (s ? new Date(s).toISOString().slice(0, 10) : undefined);
    reset({
      daysOfWeek: data.daysOfWeek ?? [],
      startDate: toDateOnly(data.startDate),
      endDate: toDateOnly(data.endDate),
    });
  }, [data, reset]);

  const days = [
    { label: "Dom", value: 0 },
    { label: "Seg", value: 1 },
    { label: "Ter", value: 2 },
    { label: "Qua", value: 3 },
    { label: "Qui", value: 4 },
    { label: "Sex", value: 5 },
    { label: "Sáb", value: 6 },
  ];

  const onToggleDay = (v: number) => {
    const selected = new Set(watch("daysOfWeek") ?? []);
    if (selected.has(v)) selected.delete(v); else selected.add(v);
    setValue("daysOfWeek", Array.from(selected).sort());
  };

  const onSubmit = (vals: FormValues) => mutation.mutate(vals);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Dias da semana</label>
          <div className="flex gap-2 flex-wrap">
            {days.map((d) => (
              <button
                type="button"
                key={d.value}
                onClick={() => onToggleDay(d.value)}
                className={`px-3 py-1 ${watch("daysOfWeek")?.includes(d.value) ? "bg-primary text-primary-foreground" : "bg-muted/40 hover:bg-muted/60"}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium">Início</label>
            <input
              id="startDate"
              type="date"
              className="input h-12 sm:h-10"
              {...register("startDate")}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium">Fim</label>
            <input
              id="endDate"
              type="date"
              className="input h-12 sm:h-10"
              {...register("endDate")}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>Salvar</Button>
        </div>
      </form>
    </div>
  );
}
