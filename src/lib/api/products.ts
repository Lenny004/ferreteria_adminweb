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

export const productsApi = {
  list: (params?: { q?: string; take?: number }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.take) search.set("take", String(params.take));
    const qs = search.toString();
    return api.get<{ items: ProductRow[]; total: number }>(
      `/products${qs ? `?${qs}` : ""}`,
    );
  },
  getById: (id: string) => api.get<ProductRow>(`/products/${id}`),
};
