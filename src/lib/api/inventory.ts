import { api } from "@/lib/api";

export type InventoryMovementType =
  | "ENTRADA_COMPRA"
  | "AJUSTE_ENTRADA"
  | "AJUSTE_SALIDA"
  | "VENTA"
  | "DEVOLUCION_VENTA";

export type InventoryMovementRow = {
  id: string;
  productId: string;
  movementType: InventoryMovementType | string;
  quantity: string | number;
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

export type CreateMovementInput = {
  productId: string;
  movementType: "ENTRADA_COMPRA" | "AJUSTE_ENTRADA" | "AJUSTE_SALIDA";
  quantity: number;
  unitCost?: number;
  reason?: string | null;
};

export const inventoryApi = {
  listMovements: (params?: { productId?: string; movementType?: string }) => {
    const search = new URLSearchParams();
    if (params?.productId) search.set("productId", params.productId);
    if (params?.movementType) search.set("movementType", params.movementType);
    const qs = search.toString();
    return api.get<{ items: InventoryMovementRow[]; total: number }>(
      `/inventory/movements${qs ? `?${qs}` : ""}`,
    );
  },
  createMovement: (data: CreateMovementInput) =>
    api.post<InventoryMovementRow>("/inventory/movements", data),
  kardex: (productId: string) =>
    api.get<{
      product: {
        id: string;
        code: string;
        description: string;
        currentStock: string | number;
        minStock: string | number;
      };
      items: InventoryMovementRow[];
      total: number;
    }>(`/inventory/kardex/${productId}`),
  listAlerts: (resolved = false) =>
    api.get<{ items: StockAlertRow[]; total: number }>(
      `/inventory/alerts?resolved=${resolved ? "true" : "false"}`,
    ),
  resolveAlert: (id: string) =>
    api.patch<StockAlertRow>(`/inventory/alerts/${id}/resolve`),
};
