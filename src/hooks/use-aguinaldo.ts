"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aguinaldoApi, type GenerateAguinaldoInput } from "@/lib/api/aguinaldo";

const KEY = ["aguinaldo"] as const;
const PAGE_SIZE = 20;

export function useAguinaldoRuns(page = 0) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: [...KEY, page],
    queryFn: () =>
      aguinaldoApi.list({
        take: PAGE_SIZE,
        skip: page * PAGE_SIZE,
      }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

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
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    pageSize: PAGE_SIZE,
    loading: query.isLoading,
    isError: query.isError,
    refresh: query.refetch,
    generate: generateMut.mutateAsync,
    approve: approveMut.mutateAsync,
    pay: payMut.mutateAsync,
    voidRun: voidMut.mutateAsync,
    submitting:
      generateMut.isPending ||
      approveMut.isPending ||
      payMut.isPending ||
      voidMut.isPending,
  };
}

export function useAguinaldoRun(id: string | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => aguinaldoApi.getById(id!),
    enabled: !!id,
  });
}
