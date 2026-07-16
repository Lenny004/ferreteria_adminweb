"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fiscalApi, type IvaReportType } from "@/lib/api/fiscal";

/** Hooks React Query para el dominio fiscal (IVA y DTE). */

/** Período IVA con generación y cierre de reportes. Invalida `["fiscal", "iva-period", year, month]`. */
export function useIvaPeriod(year: number, month: number) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["fiscal", "iva-period", year, month],
    queryFn: () => fiscalApi.getPeriod(year, month),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["fiscal", "iva-period", year, month] });

  const generateMut = useMutation({
    mutationFn: (reportType: IvaReportType) =>
      fiscalApi.generate({ year, month, reportType }),
    onSuccess: invalidate,
  });
  const closeMut = useMutation({
    mutationFn: (id: string) => fiscalApi.close(id),
    onSuccess: invalidate,
  });

  return {
    data: query.data,
    loading: query.isLoading,
    generate: generateMut.mutateAsync,
    close: closeMut.mutateAsync,
    submitting: generateMut.isPending || closeMut.isPending,
    refetch: query.refetch,
  };
}

/** Detalle de un reporte IVA por id. Query key: `["fiscal", "iva-report", id]`. */
export function useIvaReport(id: string | null) {
  return useQuery({
    queryKey: ["fiscal", "iva-report", id],
    queryFn: () => fiscalApi.getReport(id!),
    enabled: !!id,
  });
}

/** Lista DTE emitidos en un mes. Query key: `["fiscal", "dte", year, month]`. */
export function useDteList(year: number, month: number) {
  return useQuery({
    queryKey: ["fiscal", "dte", year, month],
    queryFn: () => fiscalApi.listDte({ year, month, take: 50 }),
  });
}
