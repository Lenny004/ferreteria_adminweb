"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { terminationsApi, type CreateTerminationInput } from "@/lib/api/terminations";

const TERMINATIONS_KEY = ["employee-terminations"] as const;

export function useTerminations() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: TERMINATIONS_KEY,
    queryFn: () => terminationsApi.list(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: TERMINATIONS_KEY });

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
    mutationFn: ({ id, reason }: { id: string; reason: string }) => terminationsApi.void(id, reason),
    onSuccess: invalidate,
  });

  return {
    items: query.data ?? [],
    loading: query.isLoading,
    createTermination: createMut.mutateAsync,
    approveTermination: approveMut.mutateAsync,
    payTermination: payMut.mutateAsync,
    voidTermination: (id: string, reason: string) => voidMut.mutateAsync({ id, reason }),
    submitting: createMut.isPending || approveMut.isPending || payMut.isPending || voidMut.isPending,
  };
}
