/**
 * Cliente HTTP y tipos del módulo de conteos físicos de inventario.
 */

import { api, fetchAdminResponse } from "@/lib/api";

/** Valor decimal serializado por el backend. */
export type InventoryDecimal = string | number;

/** Estados posibles de un conteo físico. */
export type InventoryCountStatus = "ABIERTO" | "APLICADO" | "CANCELADO";

/** Resumen cuantitativo y valorado de un conteo. */
export type InventoryCountSummary = {
  totalLines: number;
  countedLines: number;
  pendingLines: number;
  linesWithVariance: number;
  surplusQty: InventoryDecimal;
  surplusValue: InventoryDecimal;
  shortageQty: InventoryDecimal;
  shortageValue: InventoryDecimal;
  netQty: InventoryDecimal;
  netValue: InventoryDecimal;
};

/** Producto incluido en el detalle completo de un conteo. */
export type InventoryCountDetailProduct = {
  id: string;
  code: string;
  description: string;
  currentStock: InventoryDecimal;
  costPrice: InventoryDecimal;
  minStock: InventoryDecimal;
  measurementType: { unitLabel: string; decimals: number };
};

/** Línea incluida en la respuesta de detalle del conteo. */
export type InventoryCountDetailLine = {
  id: string;
  productId: string;
  systemStockAtStart: InventoryDecimal;
  countedQuantity: InventoryDecimal | null;
  systemStockAtCount: InventoryDecimal | null;
  countedAt?: string | null;
  varianceQuantity: InventoryDecimal | null;
  notes?: string | null;
  product: InventoryCountDetailProduct;
};

/** Producto proyectado en el listado paginado de líneas. */
export type InventoryCountLineProduct = {
  id: string;
  code: string;
  description: string;
  unit: string;
  decimals: number;
  currentStock: InventoryDecimal;
  costPrice: InventoryDecimal;
};

/** Línea devuelta por la consulta paginada del detalle. */
export type InventoryCountLine = {
  id: string;
  productId: string;
  systemStockAtStart: InventoryDecimal;
  countedQuantity: InventoryDecimal | null;
  systemStockAtCount: InventoryDecimal | null;
  countedAt?: string | null;
  varianceQuantity: InventoryDecimal | null;
  varianceValue: InventoryDecimal | null;
  notes?: string | null;
  product: InventoryCountLineProduct;
};

/** Conteo físico con sus metadatos y resumen. */
export type InventoryCount = {
  id: string;
  folio: number;
  name: string;
  status: InventoryCountStatus;
  familyId?: string | null;
  subfamilyId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  appliedAt?: string | null;
  cancelledAt?: string | null;
  summary: InventoryCountSummary;
  lines?: InventoryCountDetailLine[];
};

/** Parámetros del listado de conteos. */
export type ListInventoryCountsParams = { status?: InventoryCountStatus; take?: number; skip?: number };

/** Parámetros de búsqueda, filtro y paginación de líneas. */
export type ListInventoryCountLinesParams = {
  q?: string;
  filter?: "all" | "pending" | "counted" | "variance";
  take?: number;
  skip?: number;
};

/** Datos necesarios para crear un conteo. */
export type CreateInventoryCountInput = {
  name: string;
  familyId?: string;
  subfamilyId?: string;
  productIds?: string[];
  includeInactive?: boolean;
  notes?: string | null;
};

/** Captura de una o varias líneas. */
export type CaptureInventoryCountItem = { productId: string; countedQuantity: number; notes?: string | null };

/** Resultado paginado de conteos. */
export type InventoryCountListResult = { items: InventoryCount[]; total: number; take: number; skip: number };

/** Resultado paginado de líneas. */
export type InventoryCountLinesResult = { items: InventoryCountLine[]; total: number; take: number; skip: number };

function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const value = search.toString();
  return value ? `?${value}` : "";
}

async function downloadXlsx(path: string, fallbackName: string): Promise<void> {
  const response = await fetchAdminResponse(path, {
    headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  });
  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition");
  const filename = contentDisposition?.match(/filename="?([^\"]+)"?/i)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Cliente REST de conteos físicos, siempre autenticado con la sesión admin. */
export const inventoryCountsApi = {
  /** Lista conteos paginados por estado. */
  list: (params?: ListInventoryCountsParams) =>
    api.get<InventoryCountListResult>(
      `/inventory/counts${queryString({ status: params?.status, take: params?.take, skip: params?.skip })}`,
    ),
  /** Obtiene un conteo completo con sus líneas y resumen. */
  get: (id: string) => api.get<InventoryCount>(`/inventory/counts/${id}`),
  /** Obtiene las líneas paginadas y filtradas de un conteo. */
  lines: (id: string, params?: ListInventoryCountLinesParams) =>
    api.get<InventoryCountLinesResult>(
      `/inventory/counts/${id}/lines${queryString({ q: params?.q, filter: params?.filter, take: params?.take, skip: params?.skip })}`,
    ),
  /** Crea un conteo tomando la foto inicial de stock en el backend. */
  create: (data: CreateInventoryCountInput) => api.post<InventoryCount>("/inventory/counts", data),
  /** Captura cantidades en el lote recibido. */
  capture: (id: string, items: CaptureInventoryCountItem[]) =>
    api.patch<{ updated: number; items: InventoryCountDetailLine[] }>(`/inventory/counts/${id}/lines`, { items }),
  /** Aplica el conteo después de confirmar explícitamente. */
  apply: (id: string) =>
    api.post<InventoryCount & { movementsCreated: number }>(`/inventory/counts/${id}/apply`, { confirm: true }),
  /** Cancela un conteo abierto. */
  cancel: (id: string, reason?: string | null) =>
    api.post<InventoryCount>(`/inventory/counts/${id}/cancel`, reason?.trim() ? { reason: reason.trim() } : {}),
  /** Descarga el Excel generado por el backend. */
  exportXlsx: (id: string, folio?: number) => downloadXlsx(`/inventory/counts/${id}/export`, `conteo-${folio ?? id}.xlsx`),
};
