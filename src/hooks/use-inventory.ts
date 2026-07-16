"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi, type CreateMovementInput } from "@/lib/api/inventory";
import { productsApi } from "@/lib/api/products";

/** Hooks React Query para el dominio de inventario y stock. */

const MOVEMENTS_KEY = ["inventory", "movements"] as const;
const ALERTS_KEY = ["inventory", "alerts"] as const;

/** Historial de movimientos de inventario. Query key: `["inventory", "movements", filters]`. */
export function useInventoryMovements(params?: {
  productId?: string;
  movementType?: string;
}) {
  return useQuery({
    queryKey: [
      ...MOVEMENTS_KEY,
      params?.productId ?? "",
      params?.movementType ?? "",
    ],
    queryFn: () =>
      inventoryApi.listMovements({
        productId: params?.productId,
        movementType: params?.movementType,
      }),
  });
}

/** Alertas de stock bajo, filtradas por resueltas o pendientes. Query key: `["inventory", "alerts", resolved]`. */
export function useStockAlerts(resolved = false) {
  return useQuery({
    queryKey: [...ALERTS_KEY, resolved],
    queryFn: () => inventoryApi.listAlerts(resolved),
  });
}

/** Registra un movimiento de inventario. Invalida movements, alerts, `["products"]` y `["inventory", "valuation"]`. */
export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMovementInput) => inventoryApi.createMovement(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MOVEMENTS_KEY });
      qc.invalidateQueries({ queryKey: ALERTS_KEY });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["inventory", "valuation"] });
    },
  });
}

/** Marca una alerta de stock como resuelta. Invalida `["inventory", "alerts"]`. */
export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.resolveAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ALERTS_KEY }),
  });
}

/** Valoración actual del inventario. Query key: `["inventory", "valuation"]`. */
export function useInventoryValuation() {
  return useQuery({
    queryKey: ["inventory", "valuation"],
    queryFn: () => inventoryApi.valuation(),
  });
}

/** Productos para selector en movimientos de inventario. Query key: `["products", "inventory-picker", q]`. */
export function useProductsForInventory(q?: string) {
  return useQuery({
    queryKey: ["products", "inventory-picker", q ?? ""],
    queryFn: () => productsApi.list({ q: q || undefined, take: 50 }),
  });
}
