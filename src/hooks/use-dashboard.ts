"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api/dashboard";

/** Hooks React Query para el dominio del dashboard administrativo. */

/** Resumen del dashboard con refetch automático cada 60 s. Query key: `["dashboard", "summary"]`. */
export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => dashboardApi.summary(),
    refetchInterval: 60_000,
  });
}
