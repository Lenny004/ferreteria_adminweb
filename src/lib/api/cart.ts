/**
 * Carrito de cliente de tienda — cliente HTTP hacia `/shop/cart` (JWT rol SHOP).
 */

import { apiRequest } from "@/lib/api";
import { getShopAccessToken } from "@/lib/api/shop-auth";

export type CartProduct = {
  id: string;
  code: string;
  description: string;
  shortDescription?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  salePrice: string | number;
  currentStock: string | number;
  isActive?: boolean;
  measurementType?: { unitLabel?: string | null } | null;
};

export type CartItem = {
  id: string;
  shopCustomerId: string;
  productId: string;
  quantity: string | number;
  createdAt: string;
  updatedAt: string;
  product: CartProduct;
};

export type CartResponse = {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
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

/** Carrito del cliente autenticado en la tienda online. */
export const cartApi = {
  /** Lista ítems y subtotal del carrito. */
  getCart: () => shopRequest<CartResponse>("/shop/cart", { method: "GET" }),

  /** Agrega o actualiza la cantidad de un producto. */
  upsertItem: (data: { productId: string; quantity: number }) =>
    shopRequest<CartItem>("/shop/cart", {
      method: "PUT",
      body: data,
    }),

  /** Quita un producto del carrito. */
  removeItem: (productId: string) =>
    shopRequest<void>(`/shop/cart/${productId}`, { method: "DELETE" }),

  /** Vacía el carrito completo. */
  clearCart: () =>
    shopRequest<{ cleared: boolean }>("/shop/cart", { method: "DELETE" }),
};
