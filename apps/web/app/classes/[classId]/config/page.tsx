"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql-client";
import { useAppMutation } from "@/hooks/use-app-mutation";
import { formatGraphqlError } from "@/lib/graphql-error";
import { classQueryOptions, queryKeys } from "@/lib/query-options";
import { UpdateClassScheduleDocument } from "@/src/gql/graphql";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  daysOfWeek: z.array(z.number().int().min(0).max(6)),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const toDateOnly = (s?: string | null) => (s ? new Date(s).toISOString().slice(0, 10) : undefined);

export default function ClassConfigPage() {
  const params = useParams();
  const classId = params?.classId as string;
  const qc = useQueryClient();

  const { data, isError, error } = useQuery(classQueryOptions(classId));

  const mutation = useAppMutation({
    mutationFn: async (values: FormValues) => {
      const res = await gqlRequest(UpdateClassScheduleDocument, { id: classId, ...values });
      return res.updateClassSchedule;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.class(classId) });
      qc.invalidateQueries({ queryKey: queryKeys.attendanceDates(classId) });
    },
  });

  const { register, handleSubmit, setValue, watch, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { daysOfWeek: [], startDate: undefined, endDate: undefined },
  });

  useEffect(() => {
    if (!data) {
      return;
    }
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
    if (selected.has(v)) {
      selected.delete(v);
    } else {
      selected.add(v);
    }
    setValue("daysOfWeek", Array.from(selected).sort());
  };

  const onSubmit = async (vals: FormValues) => {
    try {
      await mutation.mutateAsync(vals);
    } catch {
      // errorMessage shown inline
    }
  };

  return (
    <div className="space-y-6">
      {isError && (
        <p className="text-sm text-destructive" role="alert">
          {formatGraphqlError(error)}
        </p>
      )}
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
            <label htmlFor="startDate" className="block text-sm font-medium">
              Início
            </label>
            <Input id="startDate" type="date" className="h-12 sm:h-10" {...register("startDate")} />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium">
              Fim
            </label>
            <Input id="endDate" type="date" className="h-12 sm:h-10" {...register("endDate")} />
          </div>
        </div>

        {mutation.errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {mutation.errorMessage}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
