"use client";

/** Hooks TanStack Query para consultar y operar conteos físicos. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  inventoryCountsApi,
  type CaptureInventoryCountItem,
  type CreateInventoryCountInput,
  type ListInventoryCountLinesParams,
  type ListInventoryCountsParams,
} from "@/lib/api/inventory-counts";

const COUNTS_KEY = ["inventory-counts"] as const;

/** Lista conteos físicos con los filtros indicados. */
export function useInventoryCounts(params?: ListInventoryCountsParams) {
  return useQuery({
    queryKey: [...COUNTS_KEY, "list", params?.status ?? "", params?.take ?? 20, params?.skip ?? 0],
    queryFn: () => inventoryCountsApi.list(params),
  });
}

/** Obtiene el detalle de un conteo. */
export function useInventoryCount(id: string) {
  return useQuery({ queryKey: [...COUNTS_KEY, "detail", id], queryFn: () => inventoryCountsApi.get(id), enabled: Boolean(id) });
}

/** Lista las líneas de un conteo, con búsqueda y filtro. */
export function useInventoryCountLines(id: string, params?: ListInventoryCountLinesParams) {
  return useQuery({
    queryKey: [...COUNTS_KEY, "lines", id, params?.q ?? "", params?.filter ?? "all", params?.take ?? 50, params?.skip ?? 0],
    queryFn: () => inventoryCountsApi.lines(id, params),
    enabled: Boolean(id),
  });
}

/** Crea un conteo e invalida los listados para reflejar el nuevo folio. */
export function useCreateInventoryCount() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (data: CreateInventoryCountInput) => inventoryCountsApi.create(data), onSuccess: () => queryClient.invalidateQueries({ queryKey: COUNTS_KEY }) });
}

/** Guarda capturas e invalida detalle y líneas del conteo. */
export function useCaptureInventoryCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: CaptureInventoryCountItem[] }) => inventoryCountsApi.capture(id, items),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...COUNTS_KEY, "detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: [...COUNTS_KEY, "lines", variables.id] });
      queryClient.invalidateQueries({ queryKey: [...COUNTS_KEY, "list"] });
    },
  });
}

/** Aplica un conteo e invalida inventario, alertas, productos y movimientos. */
export function useApplyInventoryCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryCountsApi.apply(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: COUNTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "valuation"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "movements"] });
      queryClient.invalidateQueries({ queryKey: [...COUNTS_KEY, "detail", id] });
    },
  });
}

/** Cancela un conteo e invalida su listado y detalle. */
export function useCancelInventoryCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string | null }) => inventoryCountsApi.cancel(id, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: COUNTS_KEY });
      queryClient.invalidateQueries({ queryKey: [...COUNTS_KEY, "detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: [...COUNTS_KEY, "lines", variables.id] });
    },
  });
}
