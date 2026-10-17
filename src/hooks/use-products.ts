"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  productsApi,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/lib/api/products";
import { inventoryApi } from "@/lib/api/inventory";

/** Hooks React Query del catálogo de productos y su kardex. */

const PRODUCTS_KEY = ["products"] as const;

/** Tamaño de página del catálogo en el panel. */
export const PRODUCTS_PAGE_SIZE = 20;

/** Tamaño de página del kardex por producto. */
export const KARDEX_PAGE_SIZE = 50;

/** Filtros del catálogo administrativo. */
export type ProductCatalogFilters = {
  q?: string;
  familyId?: string;
  includeInactive?: boolean;
};

/**
 * Catálogo paginado de productos. Query key: `["products", "catalog", filtros, página]`.
 *
 * @param filters - Búsqueda, familia y si se incluyen inactivos.
 * @param page - Página base cero.
 * @returns Query de React Query con `{ items, total }`.
 */
export function useProductCatalog(filters: ProductCatalogFilters, page: number) {
  return useQuery({
    queryKey: [
      ...PRODUCTS_KEY,
      "catalog",
      filters.q ?? "",
      filters.familyId ?? "",
      filters.includeInactive ?? false,
      page,
    ],
    queryFn: () =>
      productsApi.list({
        q: filters.q || undefined,
        familyId: filters.familyId || undefined,
        includeInactive: filters.includeInactive,
        take: PRODUCTS_PAGE_SIZE,
        skip: page * PRODUCTS_PAGE_SIZE,
      }),
  });
}

/**
 * Familias y unidades de medida para el formulario. Cambian poco, por eso se cachean 5 minutos.
 * Query key: `["products", "options"]`.
 */
export function useProductFormOptions() {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, "options"],
    queryFn: () => productsApi.options(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Detalle de un producto. Query key: `["products", "detail", id]`.
 *
 * @param id - UUID del producto.
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, "detail", id],
    queryFn: () => productsApi.getById(id),
    enabled: Boolean(id),
  });
}

/** Crea un producto. Invalida todo `["products"]` (catálogo, selectores y detalle). */
export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductInput) => productsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

/** Edita un producto. Invalida `["products"]` y la valuación, que depende del costo. */
export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductInput }) => productsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      qc.invalidateQueries({ queryKey: ["inventory", "valuation"] });
    },
  });
}

/**
 * Kardex paginado de un producto. Query key: `["inventory", "kardex", productId, página]`.
 *
 * @param productId - UUID del producto.
 * @param page - Página base cero.
 */
export function useProductKardex(productId: string, page: number) {
  return useQuery({
    queryKey: ["inventory", "kardex", productId, page],
    queryFn: () =>
      inventoryApi.kardex(productId, { take: KARDEX_PAGE_SIZE, skip: page * KARDEX_PAGE_SIZE }),
    enabled: Boolean(productId),
  });
}
