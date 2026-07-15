import { api } from "@/lib/api";

export type PurchaseOrderStatus = "BORRADOR" | "CONFIRMADA" | "RECIBIDA" | "CANCELADA";

export type PurchaseOrderLineInput = {
  productId: string;
  quantity: number;
  unitCost: number;
  taxRate?: number;
  notes?: string | null;
};

export type PurchaseOrderDetailRow = {
  id: string;
  productId: string;
  quantity: string | number;
  unitCost: string | number;
  taxRate: string | number;
  subtotal: string | number;
  total: string | number;
  notes?: string | null;
  product?: {
    id: string;
    code: string;
    description: string;
    currentStock: string | number;
    costPrice: string | number;
  };
};

export type PurchaseOrderRow = {
  id: string;
  supplierId: string;
  employeeId: string;
  supplierDocNumber?: string | null;
  supplierDocType?: string | null;
  status: PurchaseOrderStatus | string;
  subtotal: string | number;
  taxAmount: string | number;
  total: string | number;
  notes?: string | null;
  expectedDate?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  supplier?: {
    id: string;
    name: string;
    nit?: string | null;
    country?: string;
  };
  details?: PurchaseOrderDetailRow[];
  _count?: { details: number };
};

export type CreatePurchaseOrderInput = {
  supplierId: string;
  employeeId?: string | null;
  supplierDocNumber?: string | null;
  supplierDocType?: "CCF" | "FAC" | "OTRO" | null;
  notes?: string | null;
  expectedDate?: string | null;
  lines: PurchaseOrderLineInput[];
};

export const purchaseOrdersApi = {
  list: (params?: { q?: string; status?: string; supplierId?: string; take?: number }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.status) search.set("status", params.status);
    if (params?.supplierId) search.set("supplierId", params.supplierId);
    if (params?.take) search.set("take", String(params.take));
    const qs = search.toString();
    return api.get<{ items: PurchaseOrderRow[]; total: number }>(
      `/purchase-orders${qs ? `?${qs}` : ""}`,
    );
  },
  getById: (id: string) => api.get<PurchaseOrderRow>(`/purchase-orders/${id}`),
  create: (data: CreatePurchaseOrderInput) =>
    api.post<PurchaseOrderRow>("/purchase-orders", data),
  update: (id: string, data: Partial<CreatePurchaseOrderInput>) =>
    api.patch<PurchaseOrderRow>(`/purchase-orders/${id}`, data),
  confirm: (id: string) => api.post<PurchaseOrderRow>(`/purchase-orders/${id}/confirm`),
  receive: (
    id: string,
    data?: {
      supplierDocNumber?: string | null;
      supplierDocType?: "CCF" | "FAC" | "OTRO" | null;
    },
  ) => api.post<PurchaseOrderRow>(`/purchase-orders/${id}/receive`, data ?? {}),
  cancel: (id: string) => api.post<PurchaseOrderRow>(`/purchase-orders/${id}/cancel`),
};
