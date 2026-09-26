"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  catalogsApi,
  employeesApi,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
} from "@/lib/api/employees";

/** Hooks React Query para el dominio de empleados y catálogos RRHH. */

const EMPLOYEES_KEY = ["employees"] as const;
const PAGE_SIZE = 20;

export type EmployeeListFilters = {
  q?: string;
  isActive?: boolean;
  departmentId?: string;
  canSell?: boolean;
  canCashier?: boolean;
};

/** Lista empleados paginados con filtros. Mutaciones crear/actualizar invalidan `["employees"]`. */
export function useEmployees(filters: EmployeeListFilters = {}, page = 0) {
  const qc = useQueryClient();
  const q = filters.q ?? "";
  const isActive = filters.isActive;
  const departmentId = filters.departmentId ?? "";
  const canSell = filters.canSell;
  const canCashier = filters.canCashier;

  const listQuery = useQuery({
    queryKey: [
      ...EMPLOYEES_KEY,
      q,
      isActive ?? "all",
      departmentId,
      canSell ?? "all",
      canCashier ?? "all",
      page,
    ],
    queryFn: () =>
      employeesApi.list({
        q: q || undefined,
        isActive,
        departmentId: departmentId || undefined,
        canSell,
        canCashier,
        take: PAGE_SIZE,
        skip: page * PAGE_SIZE,
      }),
  });

  const createMut = useMutation({
    mutationFn: (data: CreateEmployeeInput) => employeesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeInput }) =>
      employeesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  });

  return {
    items: listQuery.data?.items ?? [],
    total: listQuery.data?.total ?? 0,
    pageSize: PAGE_SIZE,
    loading: listQuery.isLoading,
    error: listQuery.error,
    refresh: listQuery.refetch,
    createEmployee: createMut.mutateAsync,
    updateEmployee: (id: string, data: UpdateEmployeeInput) =>
      updateMut.mutateAsync({ id, data }),
    submitting: createMut.isPending || updateMut.isPending,
  };
}

/** Catálogo de departamentos. Query key: `["departments"]`. */
export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () => catalogsApi.departments(),
  });
}

/** Catálogo de puestos, opcionalmente filtrado por departamento. Query key: `["positions", departmentId]`. */
export function usePositions(departmentId?: string) {
  return useQuery({
    queryKey: ["positions", departmentId ?? "all"],
    queryFn: () => catalogsApi.positions(departmentId),
  });
}
