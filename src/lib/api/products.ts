/**
 * Productos — cliente HTTP hacia `/products`.
 */

import { api } from "@/lib/api";

export type ProductRow = {
  id: string;
  code: string;
  description: string;
  salePrice: string | number;
  costPrice: string | number;
  currentStock: string | number;
  minStock: string | number;
  isActive: boolean;
  family?: { id: string; code: string; name: string } | null;
  measurementType?: { id: string; code: string; name: string } | null;
};

/** Consulta de productos para compras e inventario. */
export const productsApi = {
  /** Lista productos (`q`, `familyId`, `inStock`, `take`, `skip`). */
  list: (params?: {
    q?: string;
    familyId?: string;
    inStock?: boolean;
    take?: number;
    skip?: number;
  }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.familyId) search.set("familyId", params.familyId);
    if (params?.inStock === true) search.set("inStock", "true");
    if (params?.take) search.set("take", String(params.take));
    if (params?.skip != null) search.set("skip", String(params.skip));
    const qs = search.toString();
    return api.get<{ items: ProductRow[]; total: number }>(
      `/products${qs ? `?${qs}` : ""}`,
    );
  },
  /** Obtiene un producto por id. */
  getById: (id: string) => api.get<ProductRow>(`/products/${id}`),
};
