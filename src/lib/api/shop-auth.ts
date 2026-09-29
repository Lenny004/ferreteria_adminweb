/** Cliente HTTP de autenticación de clientes hacia `/shop/auth`. */

import { ApiError, apiRequest } from "@/lib/api";
import {
  clearShopSessionState,
  emitShopSessionChanged,
  setShopCustomer,
  setShopSession,
  type ShopCustomer,
} from "@/lib/shop-session-state";

export type { ShopCustomer } from "@/lib/shop-session-state";

export type ShopAuthResult = {
  accessToken: string;
  customer: ShopCustomer;
  csrfToken: string;
};

/** Ejecuta una llamada autenticada por cookie dentro del dominio de tienda. */
function shopRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: HeadersInit;
    skipCsrf?: boolean;
  } = {},
): Promise<T> {
  const { body, method, headers, skipCsrf } = options;
  return apiRequest<T>(path, {
    method,
    headers,
    token: null,
    auth: "shop",
    skipCsrf,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Registro, login, perfil y cierre de sesión del cliente de tienda. */
export const shopAuthApi = {
  /** Registra un cliente, conserva el perfil y el CSRF recibidos en memoria. */
  register: async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string | null;
  }) => {
    const result = await apiRequest<ShopAuthResult>("/shop/auth/register", {
      method: "POST",
      token: null,
      auth: "shop",
      body: JSON.stringify(data),
    });
    setShopSession(result.customer, result.csrfToken);
    emitShopSessionChanged();
    return result;
  },

  /** Inicia sesión y conserva el perfil y CSRF recibidos en memoria. */
  login: async (email: string, password: string) => {
    const result = await apiRequest<ShopAuthResult>("/shop/auth/login", {
      method: "POST",
      token: null,
      auth: "shop",
      body: JSON.stringify({ email, password }),
    });
    setShopSession(result.customer, result.csrfToken);
    emitShopSessionChanged();
    return result;
  },

  /** Recupera el cliente autenticado desde la cookie y actualiza el estado en memoria. */
  me: async () => {
    const customer = await shopRequest<ShopCustomer>("/shop/auth/me", { method: "GET" });
    setShopCustomer(customer);
    return customer;
  },

  /** Actualiza nombre y teléfono del perfil y sincroniza el cliente en memoria. */
  updateProfile: async (data: { fullName?: string; phone?: string | null }) => {
    const customer = await shopRequest<ShopCustomer>("/shop/auth/me", {
      method: "PATCH",
      body: data,
    });
    setShopCustomer(customer);
    return customer;
  },

  /** Cambia la contraseña del cliente autenticado. */
  changePassword: (currentPassword: string, newPassword: string) =>
    shopRequest<{ ok?: boolean }>("/shop/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    }),

  /** Solicita restablecimiento de contraseña sin requerir una sesión. */
  forgotPassword: (email: string) =>
    apiRequest<{ message?: string; resetToken?: string }>("/shop/auth/forgot-password", {
      method: "POST",
      token: null,
      auth: "shop",
      body: JSON.stringify({ email }),
    }),

  /** Restablece la contraseña con un token recibido por correo. */
  resetPassword: (token: string, newPassword: string) =>
    apiRequest<{ message?: string }>("/shop/auth/reset-password", {
      method: "POST",
      token: null,
      auth: "shop",
      body: JSON.stringify({ token, newPassword }),
    }),

  /** Solicita logout al backend y siempre revoca el estado local de tienda. */
  logout: async (): Promise<void> => {
    try {
      try {
        await shopRequest<void>("/shop/auth/logout", { method: "POST" });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          // Una sesión vencida permite cerrar localmente sin CSRF y limpiar cookies vigentes.
          await shopRequest<void>("/shop/auth/logout", { method: "POST", skipCsrf: true });
        }
      }
    } catch {
      // El estado local debe revocarse aunque la red no permita completar el logout.
    } finally {
      clearShopSessionState();
      emitShopSessionChanged();
    }
  },
};
