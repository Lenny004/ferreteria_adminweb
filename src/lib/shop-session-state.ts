/**
 * Estado efímero de la sesión de tienda.
 * La autenticación vive en cookies httpOnly; el cliente solo conserva el
 * cliente validado y el token CSRF necesario para las mutaciones.
 */

/** Cliente autenticado en la tienda online. */
export type ShopCustomer = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
};

export const SHOP_SESSION_CHANGED_EVENT = "shop-session-changed";

const LEGACY_SHOP_TOKEN_KEY = "ferreteria_shop_token";

let shopCustomer: ShopCustomer | null = null;
let shopCsrfToken: string | null = null;
let shopCsrfRequestInFlight: Promise<string> | null = null;
let shopSessionRevision = 0;

/** Devuelve el cliente validado por la última respuesta de la API. */
export function getShopCustomer(): ShopCustomer | null {
  return shopCustomer;
}

/** Guarda en memoria el cliente validado por la API. */
export function setShopCustomer(customer: ShopCustomer | null): void {
  shopCustomer = customer;
}

/** Devuelve el token CSRF de tienda almacenado únicamente en memoria. */
export function getShopCsrfToken(): string | null {
  return shopCsrfToken;
}

/** Guarda en memoria el token CSRF emitido por el backend de tienda. */
export function setShopCsrfToken(token: string | null): void {
  shopCsrfToken = token;
}

/** Limpia únicamente el CSRF de tienda para poder solicitar una rotación. */
export function clearShopCsrfToken(): void {
  shopCsrfToken = null;
}

/** Limpia el cliente y el CSRF de tienda sin tocar el estado administrativo. */
export function clearShopSessionState(): void {
  shopCustomer = null;
  clearShopCsrfToken();
  shopSessionRevision += 1;
  shopCsrfRequestInFlight = null;
}

/** Guarda el resultado de login/registro y marca una nueva sesión de tienda. */
export function setShopSession(customer: ShopCustomer, csrfToken: string | null): void {
  shopCustomer = customer;
  shopCsrfToken = csrfToken;
  shopSessionRevision += 1;
  shopCsrfRequestInFlight = null;
}

/** Emite el evento que sincroniza los componentes de tienda en el navegador. */
export function emitShopSessionChanged(): void {
  shopSessionRevision += 1;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SHOP_SESSION_CHANGED_EVENT));
  }
}

/** Devuelve una versión monotónica para ignorar respuestas de sesión obsoletas. */
export function getShopSessionRevision(): number {
  return shopSessionRevision;
}

/**
 * Deduplica la recuperación del CSRF de tienda entre mutaciones concurrentes.
 *
 * @param request - Función que ejecuta GET `/shop/auth/csrf`.
 * @returns Token CSRF almacenado en memoria.
 */
export function ensureShopCsrfToken(request: () => Promise<string>): Promise<string> {
  if (shopCsrfToken) return Promise.resolve(shopCsrfToken);
  if (!shopCsrfRequestInFlight) {
    const revisionAtRequest = shopSessionRevision;
    const requestInFlight = request()
      .then((token) => {
        if (shopSessionRevision === revisionAtRequest) setShopCsrfToken(token);
        return token;
      })
      .finally(() => {
        if (shopCsrfRequestInFlight === requestInFlight) shopCsrfRequestInFlight = null;
      });
    shopCsrfRequestInFlight = requestInFlight;
  }
  return shopCsrfRequestInFlight;
}

/** Elimina la clave del modelo Bearer anterior sin tocar otras claves. */
export function migrateLegacyShopStorage(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LEGACY_SHOP_TOKEN_KEY);
}
