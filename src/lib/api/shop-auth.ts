/**
 * Auth de clientes de tienda — cliente HTTP hacia `/shop/auth` (rol SHOP, token `ferreteria_shop_token`).
 */

import { apiRequest } from "@/lib/api";

const SHOP_TOKEN_KEY = "ferreteria_shop_token";

let shopTokenInMemory: string | null = null;

export type ShopCustomer = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
};

export type ShopAuthResult = {
  accessToken: string;
  customer: ShopCustomer;
};

/** Lee el JWT de tienda desde memoria o sessionStorage. */
export function getShopAccessToken(): string | null {
  if (shopTokenInMemory) return shopTokenInMemory;
  if (typeof window !== "undefined") {
    shopTokenInMemory = sessionStorage.getItem(SHOP_TOKEN_KEY);
  }
  return shopTokenInMemory;
}

/** Persiste o borra el JWT de tienda y notifica a los listeners. */
export function setShopAccessToken(token: string | null): void {
  shopTokenInMemory = token;
  if (typeof window !== "undefined") {
    if (token) sessionStorage.setItem(SHOP_TOKEN_KEY, token);
    else sessionStorage.removeItem(SHOP_TOKEN_KEY);
    window.dispatchEvent(new Event("shop-token-changed"));
  }
}

function shopRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: HeadersInit;
  } = {},
): Promise<T> {
  const { body, method, headers } = options;
  return apiRequest<T>(path, {
    method,
    headers,
    token: getShopAccessToken(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Registro, login y perfil del cliente de la tienda online. */
export const shopAuthApi = {
  /** Registra un cliente y guarda el token. */
  register: async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string | null;
  }) => {
    const result = await apiRequest<ShopAuthResult>("/shop/auth/register", {
      method: "POST",
      token: null,
      body: JSON.stringify(data),
    });
    setShopAccessToken(result.accessToken);
    return result;
  },

  /** Inicia sesión y guarda el token. */
  login: async (email: string, password: string) => {
    const result = await apiRequest<ShopAuthResult>("/shop/auth/login", {
      method: "POST",
      token: null,
      body: JSON.stringify({ email, password }),
    });
    setShopAccessToken(result.accessToken);
    return result;
  },

  /** Perfil del cliente autenticado. */
  me: () => shopRequest<ShopCustomer>("/shop/auth/me", { method: "GET" }),

  /** Actualiza nombre y teléfono del perfil. */
  updateProfile: (data: { fullName?: string; phone?: string | null }) =>
    shopRequest<ShopCustomer>("/shop/auth/me", {
      method: "PATCH",
      body: data,
    }),

  /** Cambia la contraseña del cliente autenticado. */
  changePassword: (currentPassword: string, newPassword: string) =>
    shopRequest<{ ok?: boolean }>("/shop/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    }),

  /** Solicita restablecimiento de contraseña (sin autenticación). */
  forgotPassword: (email: string) =>
    apiRequest<{ message?: string; resetToken?: string }>("/shop/auth/forgot-password", {
      method: "POST",
      token: null,
      body: JSON.stringify({ email }),
    }),

  /** Restablece contraseña con token recibido por correo. */
  resetPassword: (token: string, newPassword: string) =>
    apiRequest<{ message?: string }>("/shop/auth/reset-password", {
      method: "POST",
      token: null,
      body: JSON.stringify({ token, newPassword }),
    }),

  /** Borra el token local (logout cliente). */
  logout: () => {
    setShopAccessToken(null);
  },
};
