"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  suppliersApi,
  type CreateSupplierInput,
} from "@/lib/api/suppliers";

const SUPPLIERS_KEY = ["suppliers"] as const;

export function useSuppliers(q = "") {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: [...SUPPLIERS_KEY, q],
    queryFn: () => suppliersApi.list({ q: q || undefined, take: 100 }),
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
    loading: query.isLoading,
    createSupplier: createMut.mutateAsync,
    updateSupplier: updateMut.mutateAsync,
    submitting: createMut.isPending || updateMut.isPending,
  };
}
