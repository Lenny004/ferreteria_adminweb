"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aguinaldoApi, type GenerateAguinaldoInput } from "@/lib/api/aguinaldo";

const AGUINALDO_KEY = ["aguinaldo"] as const;

export function useAguinaldoRuns() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: AGUINALDO_KEY,
    queryFn: () => aguinaldoApi.list(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: AGUINALDO_KEY });

  const generateMut = useMutation({
    mutationFn: (data: GenerateAguinaldoInput) => aguinaldoApi.generate(data),
    onSuccess: invalidate,
  });
  const approveMut = useMutation({
    mutationFn: (id: string) => aguinaldoApi.approve(id),
    onSuccess: invalidate,
  });
  const payMut = useMutation({
    mutationFn: (id: string) => aguinaldoApi.pay(id),
    onSuccess: invalidate,
  });
  const voidMut = useMutation({
    mutationFn: (id: string) => aguinaldoApi.void(id),
    onSuccess: invalidate,
  });

  return {
    items: query.data ?? [],
    loading: query.isLoading,
    generateRun: generateMut.mutateAsync,
    approveRun: approveMut.mutateAsync,
    payRun: payMut.mutateAsync,
    voidRun: voidMut.mutateAsync,
    submitting: generateMut.isPending || approveMut.isPending || payMut.isPending || voidMut.isPending,
  };
}

export function useAguinaldoRun(id: string | null) {
  const query = useQuery({
    queryKey: [...AGUINALDO_KEY, "detail", id],
    queryFn: () => aguinaldoApi.getById(id as string),
    enabled: !!id,
  });

  return { run: query.data, loading: query.isLoading };
}
