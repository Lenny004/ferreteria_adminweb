"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  payrollPeriodsApi,
  payrollRunsApi,
  type CreatePayrollPeriodInput,
  type GeneratePayrollRunInput,
  type PayrollPeriodType,
  type PayrollRunStatus,
  type UpdatePayrollDetailInput,
  type UpdatePayrollPeriodInput,
} from "@/lib/api/payroll";

const PERIODS_KEY = ["payroll-periods"] as const;
const RUNS_KEY = ["payroll-runs"] as const;

export function usePayrollPeriods(params?: { periodType?: PayrollPeriodType; isClosed?: boolean }) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: [...PERIODS_KEY, params?.periodType ?? "", params?.isClosed ?? ""],
    queryFn: () => payrollPeriodsApi.list(params),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: PERIODS_KEY });

  const createMut = useMutation({
    mutationFn: (data: CreatePayrollPeriodInput) => payrollPeriodsApi.create(data),
    onSuccess: invalidate,
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePayrollPeriodInput }) =>
      payrollPeriodsApi.update(id, data),
    onSuccess: invalidate,
  });
  const closeMut = useMutation({
    mutationFn: (id: string) => payrollPeriodsApi.close(id),
    onSuccess: invalidate,
  });
  const reopenMut = useMutation({
    mutationFn: (id: string) => payrollPeriodsApi.reopen(id),
    onSuccess: invalidate,
  });

  return {
    items: query.data ?? [],
    loading: query.isLoading,
    createPeriod: createMut.mutateAsync,
    updatePeriod: (id: string, data: UpdatePayrollPeriodInput) => updateMut.mutateAsync({ id, data }),
    closePeriod: closeMut.mutateAsync,
    reopenPeriod: reopenMut.mutateAsync,
    submitting:
      createMut.isPending || updateMut.isPending || closeMut.isPending || reopenMut.isPending,
  };
}

export function usePayrollRuns(
  params?: { periodId?: string; status?: PayrollRunStatus },
  page = 0,
) {
  const qc = useQueryClient();
  const pageSize = 20;
  const query = useQuery({
    queryKey: [...RUNS_KEY, params?.periodId ?? "", params?.status ?? "", page],
    queryFn: () =>
      payrollRunsApi.list({
        ...params,
        take: pageSize,
        skip: page * pageSize,
      }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: RUNS_KEY });
    qc.invalidateQueries({ queryKey: PERIODS_KEY });
  };

  const generateMut = useMutation({
    mutationFn: (data: GeneratePayrollRunInput) => payrollRunsApi.generate(data),
    onSuccess: invalidate,
  });
  const approveMut = useMutation({
    mutationFn: (id: string) => payrollRunsApi.approve(id),
    onSuccess: invalidate,
  });
  const payMut = useMutation({
    mutationFn: (id: string) => payrollRunsApi.pay(id),
    onSuccess: invalidate,
  });
  const voidMut = useMutation({
    mutationFn: (id: string) => payrollRunsApi.void(id),
    onSuccess: invalidate,
  });

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    pageSize,
    loading: query.isLoading,
    isError: query.isError,
    refresh: query.refetch,
    generateRun: generateMut.mutateAsync,
    approveRun: approveMut.mutateAsync,
    payRun: payMut.mutateAsync,
    voidRun: voidMut.mutateAsync,
    submitting:
      generateMut.isPending || approveMut.isPending || payMut.isPending || voidMut.isPending,
  };
}

export function usePayrollRun(id: string | null) {
  const query = useQuery({
    queryKey: [...RUNS_KEY, "detail", id],
    queryFn: () => payrollRunsApi.getById(id as string),
    enabled: !!id,
  });

  return {
    run: query.data,
    loading: query.isLoading,
  };
}

export function useUpdatePayrollDetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePayrollDetailInput }) =>
      payrollRunsApi.updateDetail(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RUNS_KEY });
    },
  });
}
