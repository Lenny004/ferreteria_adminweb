/**
 * Favoritos de cliente de tienda — cliente HTTP hacia `/shop/favorites` (JWT rol SHOP).
 */

import { apiRequest } from "@/lib/api";
import { getShopAccessToken } from "@/lib/api/shop-auth";

export type FavoriteProduct = {
  id: string;
  code: string;
  description: string;
  salePrice: string | number;
  currentStock: string | number;
  family?: { id: string; name: string } | null;
  measurementType?: { unitLabel?: string | null } | null;
};

export type FavoriteRow = {
  id: string;
  shopCustomerId: string;
  productId: string;
  createdAt: string;
  product: FavoriteProduct;
};

function shopRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; headers?: HeadersInit } = {},
): Promise<T> {
  const { body, method, headers } = options;
  return apiRequest<T>(path, {
    method,
    headers,
    token: getShopAccessToken(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Lista de productos favoritos del cliente autenticado en la tienda. */
export const favoritesApi = {
  /** Lista favoritos del cliente. */
  list: () => shopRequest<FavoriteRow[]>("/shop/favorites", { method: "GET" }),
  /** Agrega un producto a favoritos. */
  add: (productId: string) =>
    shopRequest<FavoriteRow>("/shop/favorites", {
      method: "POST",
      body: { productId },
    }),
  /** Quita un producto de favoritos. */
  remove: (productId: string) =>
    shopRequest<void>(`/shop/favorites/${productId}`, { method: "DELETE" }),
};
