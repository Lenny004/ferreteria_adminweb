/**
 * Catálogo público de la tienda — cliente HTTP hacia `/public/catalog` (sin JWT).
 */

import { apiRequest } from "@/lib/api";

export type PublicFamily = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
};

export type PublicSubfamily = {
  id: string;
  familyId: string;
  code: string;
  name: string;
};

export type PublicProduct = {
  id: string;
  code: string;
  description: string;
  salePrice: string | number;
  currentStock: string | number;
  familyId?: string | null;
  subfamilyId?: string | null;
  family?: { id: string; code: string; name: string } | null;
  subfamily?: { id: string; name: string } | null;
  measurementType?: {
    id: string;
    code: string;
    name: string;
    unitLabel?: string | null;
  } | null;
};

export type PublicCatalogListParams = {
  q?: string;
  familyId?: string;
  subfamilyId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "price_asc" | "price_desc" | "name_asc" | "name_desc";
  take?: number;
  skip?: number;
};

export type PublicCatalogListResult = {
  items: PublicProduct[];
  total: number;
  take: number;
  skip: number;
};

function buildQuery(params?: PublicCatalogListParams): string {
  const search = new URLSearchParams();
  if (!params) return "";
  if (params.q) search.set("q", params.q);
  if (params.familyId) search.set("familyId", params.familyId);
  if (params.subfamilyId) search.set("subfamilyId", params.subfamilyId);
  if (params.minPrice != null) search.set("minPrice", String(params.minPrice));
  if (params.maxPrice != null) search.set("maxPrice", String(params.maxPrice));
  if (params.inStock === true) search.set("inStock", "true");
  if (params.sort) search.set("sort", params.sort);
  if (params.take != null) search.set("take", String(params.take));
  if (params.skip != null) search.set("skip", String(params.skip));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function publicGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET", token: null });
}

/** Productos, familias y subfamilias visibles en la tienda online. */
export const publicCatalogApi = {
  /** Lista productos con filtros y ordenamiento. */
  listProducts: (params?: PublicCatalogListParams) =>
    publicGet<PublicCatalogListResult>(`/public/catalog/products${buildQuery(params)}`),
  /** Obtiene un producto por id. */
  getProduct: (id: string) => publicGet<PublicProduct>(`/public/catalog/products/${id}`),
  /** Lista familias de productos. */
  listFamilies: () => publicGet<PublicFamily[]>("/public/catalog/families"),
  /** Lista subfamilias; opcionalmente filtradas por `familyId`. */
  listSubfamilies: (familyId?: string) => {
    const qs = familyId ? `?familyId=${encodeURIComponent(familyId)}` : "";
    return publicGet<PublicSubfamily[]>(`/public/catalog/subfamilies${qs}`);
  },
};
