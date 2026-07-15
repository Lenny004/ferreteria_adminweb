"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  terminationsApi,
  type CreateTerminationInput,
} from "@/lib/api/terminations";
import { employeesApi } from "@/lib/api/employees";

const KEY = ["employee-terminations"] as const;

export function useTerminations() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: KEY,
    queryFn: () => terminationsApi.list(),
  });
  const employeesQuery = useQuery({
    queryKey: ["employees", "termination-picker"],
    queryFn: () => employeesApi.list({ take: 200 }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ["employees"] });
  };

  const createMut = useMutation({
    mutationFn: (data: CreateTerminationInput) => terminationsApi.create(data),
    onSuccess: invalidate,
  });
  const approveMut = useMutation({
    mutationFn: (id: string) => terminationsApi.approve(id),
    onSuccess: invalidate,
  });
  const payMut = useMutation({
    mutationFn: (id: string) => terminationsApi.pay(id),
    onSuccess: invalidate,
  });
  const voidMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      terminationsApi.void(id, reason),
    onSuccess: invalidate,
  });

  return {
    items: query.data ?? [],
    employees: employeesQuery.data?.items ?? [],
    loading: query.isLoading,
    create: createMut.mutateAsync,
    approve: approveMut.mutateAsync,
    pay: payMut.mutateAsync,
    voidTermination: voidMut.mutateAsync,
    submitting:
      createMut.isPending ||
      approveMut.isPending ||
      payMut.isPending ||
      voidMut.isPending,
  };
}
