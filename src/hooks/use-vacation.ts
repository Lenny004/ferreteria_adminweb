"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vacationApi } from "@/lib/api/vacation";
import { employeesApi } from "@/lib/api/employees";

/** Hooks React Query para el dominio de vacaciones y permisos. */

const BALANCES_KEY = ["vacation-balances"] as const;
const REQUESTS_KEY = ["leave-requests"] as const;

/** Saldos de vacaciones por año. `ensure` invalida `["vacation-balances"]`. Query key: `["vacation-balances", year]`. */
export function useVacationBalances(year?: number) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: [...BALANCES_KEY, year ?? "all"],
    queryFn: () => vacationApi.listBalances({ year }),
  });

  const ensureMut = useMutation({
    mutationFn: (y: number) => vacationApi.ensureBalances(y),
    onSuccess: () => qc.invalidateQueries({ queryKey: BALANCES_KEY }),
  });

  return {
    items: query.data ?? [],
    loading: query.isLoading,
    ensure: ensureMut.mutateAsync,
    ensuring: ensureMut.isPending,
  };
}

export type LeaveRequestFilters = {
  status?: string;
  employeeId?: string;
  leaveTypeId?: string;
};

/** Solicitudes de permiso paginadas con tipos y empleados para picker. Mutaciones invalidan `["leave-requests"]` y `["vacation-balances"]`. */
export function useLeaveRequests(filters: LeaveRequestFilters | string = {}, page = 0) {
  const qc = useQueryClient();
  const pageSize = 20;
  const normalized: LeaveRequestFilters =
    typeof filters === "string" ? { status: filters || undefined } : filters;
  const status = normalized.status;
  const employeeId = normalized.employeeId;
  const leaveTypeId = normalized.leaveTypeId;

  const query = useQuery({
    queryKey: [
      ...REQUESTS_KEY,
      status ?? "all",
      employeeId ?? "all",
      leaveTypeId ?? "all",
      page,
    ],
    queryFn: () =>
      vacationApi.listLeaveRequests({
        status,
        employeeId,
        leaveTypeId,
        take: pageSize,
        skip: page * pageSize,
      }),
  });
  const typesQuery = useQuery({
    queryKey: ["leave-types"],
    queryFn: () => vacationApi.listLeaveTypes(),
  });
  const employeesQuery = useQuery({
    queryKey: ["employees", "leave-picker"],
    queryFn: () => employeesApi.list({ take: 200 }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: REQUESTS_KEY });
    qc.invalidateQueries({ queryKey: BALANCES_KEY });
  };

  const createMut = useMutation({
    mutationFn: vacationApi.createLeaveRequest,
    onSuccess: invalidate,
  });
  const approveMut = useMutation({
    mutationFn: (id: string) => vacationApi.approveLeaveRequest(id),
    onSuccess: invalidate,
  });
  const rejectMut = useMutation({
    mutationFn: (id: string) => vacationApi.rejectLeaveRequest(id),
    onSuccess: invalidate,
  });

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    pageSize,
    leaveTypes: typesQuery.data ?? [],
    employees: employeesQuery.data?.items ?? [],
    loading: query.isLoading,
    create: createMut.mutateAsync,
    approve: approveMut.mutateAsync,
    reject: rejectMut.mutateAsync,
    submitting: createMut.isPending || approveMut.isPending || rejectMut.isPending,
  };
}
