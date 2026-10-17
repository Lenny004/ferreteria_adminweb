/**
 * Inventario (movimientos, kardex, alertas, valoración) — cliente HTTP hacia `/inventory`.
 */

import { api } from "@/lib/api";

import type { InventoryMovementType as InventoryMovementTypeValue } from "@/lib/inventory-movements";

export type { InventoryMovementType } from "@/lib/inventory-movements";

export type InventoryMovementRow = {
  id: string;
  productId: string;
  movementType: InventoryMovementTypeValue | string;
  quantity: string | number;
  direction?: "ENTRADA" | "SALIDA";
  unitCost: string | number;
  totalCost: string | number;
  stockBefore: string | number;
  stockAfter: string | number;
  reason?: string | null;
  createdAt: string;
  product?: {
    id: string;
    code: string;
    description: string;
    currentStock: string | number;
    minStock: string | number;
  };
};

export type StockAlertRow = {
  id: string;
  productId: string;
  currentStock: string | number;
  minStock: string | number;
  isResolved: boolean;
  resolvedAt?: string | null;
  createdAt: string;
  product?: {
    id: string;
    code: string;
    description: string;
    currentStock: string | number;
    minStock: string | number;
  };
};

/** Línea del kardex: movimiento con el saldo valorado (`stockAfter × unitCost`). */
export type KardexRow = InventoryMovementRow & { valuedBalance: string };

/** Respuesta de `GET /inventory/kardex/:productId`. */
export type KardexResponse = {
  product: {
    id: string;
    code: string;
    description: string;
    currentStock: string | number;
    minStock: string | number;
    costPrice: string | number;
    salePrice: string | number;
    /** Stock actual × costo promedio, calculado por la API. */
    inventoryValue: string;
  };
  items: KardexRow[];
  total: number;
  take: number;
  skip: number;
};

export type CreateMovementInput = {
  productId: string;
  movementType: "ENTRADA_COMPRA" | "AJUSTE_ENTRADA" | "AJUSTE_SALIDA";
  quantity: number;
  unitCost?: number;
  reason?: string | null;
};

/** Movimientos de stock, kardex, alertas y valoración de inventario. */
export const inventoryApi = {
  /** Lista movimientos (`productId`, `movementType`). */
  listMovements: (params?: { productId?: string; movementType?: string }) => {
    const search = new URLSearchParams();
    if (params?.productId) search.set("productId", params.productId);
    if (params?.movementType) search.set("movementType", params.movementType);
    const qs = search.toString();
    return api.get<{ items: InventoryMovementRow[]; total: number }>(
      `/inventory/movements${qs ? `?${qs}` : ""}`,
    );
  },
  /** Registra un movimiento de entrada o ajuste. */
  createMovement: (data: CreateMovementInput) =>
    api.post<InventoryMovementRow>("/inventory/movements", data),
  /** Kardex paginado de un producto (más reciente primero, `take` máximo 500). */
  kardex: (productId: string, params?: { take?: number; skip?: number }) => {
    const search = new URLSearchParams();
    if (params?.take) search.set("take", String(params.take));
    if (params?.skip != null) search.set("skip", String(params.skip));
    const qs = search.toString();
    return api.get<KardexResponse>(
      `/inventory/kardex/${encodeURIComponent(productId)}${qs ? `?${qs}` : ""}`,
    );
  },
  /** Alertas de stock bajo (`resolved`). */
  listAlerts: (resolved = false) =>
    api.get<{ items: StockAlertRow[]; total: number }>(
      `/inventory/alerts?resolved=${resolved ? "true" : "false"}`,
    ),
  /** Marca una alerta como resuelta. */
  resolveAlert: (id: string) =>
    api.patch<StockAlertRow>(`/inventory/alerts/${id}/resolve`),
  /** Valoración de inventario (top 50 productos). */
  valuation: () =>
    api.get<{
      items: Array<{
        id: string;
        code: string;
        description: string;
        currentStock: string | number;
        costPrice: string | number;
        inventoryValue: string;
      }>;
      total: number;
      totalInventoryValue: string;
    }>("/inventory/valuation?take=50"),
};
