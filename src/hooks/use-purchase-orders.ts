"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  purchaseOrdersApi,
  type CreatePurchaseOrderInput,
} from "@/lib/api/purchase-orders";
import { productsApi } from "@/lib/api/products";
import { suppliersApi } from "@/lib/api/suppliers";

/** Hooks React Query para el dominio de órdenes de compra. */

const ORDERS_KEY = ["purchase-orders"] as const;

/** Lista órdenes con filtros y workflow (crear, confirmar, recibir, cancelar). Invalida `["purchase-orders"]`, `["inventory"]` y `["products"]`. */
export function usePurchaseOrders(params?: {
  q?: string;
  status?: string;
  supplierId?: string;
}) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: [
      ...ORDERS_KEY,
      params?.q ?? "",
      params?.status ?? "",
      params?.supplierId ?? "",
    ],
    queryFn: () =>
      purchaseOrdersApi.list({
        q: params?.q || undefined,
        status: params?.status || undefined,
        supplierId: params?.supplierId || undefined,
        take: 100,
      }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ORDERS_KEY });
    qc.invalidateQueries({ queryKey: ["inventory"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const createMut = useMutation({
    mutationFn: (data: CreatePurchaseOrderInput) => purchaseOrdersApi.create(data),
    onSuccess: invalidate,
  });
  const confirmMut = useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.confirm(id),
    onSuccess: invalidate,
  });
  const receiveMut = useMutation({
    mutationFn: ({
      id,
      docNumber,
      docType,
    }: {
      id: string;
      docNumber?: string;
      docType?: "CCF" | "FAC" | "OTRO";
    }) =>
      purchaseOrdersApi.receive(id, {
        supplierDocNumber: docNumber || null,
        supplierDocType: docType ?? null,
      }),
    onSuccess: invalidate,
  });
  const cancelMut = useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.cancel(id),
    onSuccess: invalidate,
  });

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    createOrder: createMut.mutateAsync,
    confirmOrder: confirmMut.mutateAsync,
    receiveOrder: receiveMut.mutateAsync,
    cancelOrder: cancelMut.mutateAsync,
    submitting:
      createMut.isPending ||
      confirmMut.isPending ||
      receiveMut.isPending ||
      cancelMut.isPending,
  };
}

/** Proveedores y productos para formularios de OC. Keys: `["suppliers", "picker"]`, `["products", "po-picker"]`. */
export function usePurchaseOrderPickers() {
  const suppliers = useQuery({
    queryKey: ["suppliers", "picker"],
    queryFn: () => suppliersApi.list({ take: 200 }),
  });
  const products = useQuery({
    queryKey: ["products", "po-picker"],
    queryFn: () => productsApi.list({ take: 200 }),
  });
  return {
    suppliers: suppliers.data?.items ?? [],
    products: products.data?.items ?? [],
    loading: suppliers.isLoading || products.isLoading,
  };
}
