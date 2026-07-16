"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  suppliersApi,
  type CreateSupplierInput,
} from "@/lib/api/suppliers";

/** Hooks React Query para el dominio de proveedores. */

const SUPPLIERS_KEY = ["suppliers"] as const;
const PAGE_SIZE = 20;

export type SupplierListFilters = {
  q?: string;
  activeOnly?: boolean;
  country?: string;
  withCredit?: boolean;
};

/** Lista proveedores paginados con filtros. Mutaciones crear/actualizar invalidan `["suppliers"]`. */
export function useSuppliers(filters: SupplierListFilters | string = {}, page = 0) {
  const qc = useQueryClient();
  const normalized: SupplierListFilters =
    typeof filters === "string" ? { q: filters } : filters;
  const q = normalized.q ?? "";
  const activeOnly = normalized.activeOnly;
  const country = normalized.country ?? "";
  const withCredit = normalized.withCredit;

  const query = useQuery({
    queryKey: [
      ...SUPPLIERS_KEY,
      q,
      activeOnly ?? "default",
      country,
      withCredit ?? false,
      page,
    ],
    queryFn: () =>
      suppliersApi.list({
        q: q || undefined,
        activeOnly,
        country: country || undefined,
        withCredit: withCredit || undefined,
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
