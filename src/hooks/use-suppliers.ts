"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  suppliersApi,
  type CreateSupplierInput,
} from "@/lib/api/suppliers";

const SUPPLIERS_KEY = ["suppliers"] as const;
const PAGE_SIZE = 20;

export function useSuppliers(q = "", page = 0) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: [...SUPPLIERS_KEY, q, page],
    queryFn: () =>
      suppliersApi.list({
        q: q || undefined,
        take: PAGE_SIZE,
        skip: page * PAGE_SIZE,
      }),
  });

  const createMut = useMutation({
    mutationFn: (data: CreateSupplierInput) => suppliersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUPPLIERS_KEY }),
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateSupplierInput> & { isActive?: boolean };
    }) => suppliersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUPPLIERS_KEY }),
  });

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    pageSize: PAGE_SIZE,
    loading: query.isLoading,
    error: query.error,
    isError: query.isError,
    refresh: query.refetch,
    createSupplier: createMut.mutateAsync,
    updateSupplier: updateMut.mutateAsync,
    submitting: createMut.isPending || updateMut.isPending,
  };
}
