/**
 * Cliente HTTP hacia ferreteria_backend (`/api/v1`).
 * Admin y tienda usan cookies httpOnly separadas y CSRF en memoria.
 */

import {
  clearCsrfToken,
  clearSessionState,
  ensureCsrfToken,
  getCsrfToken,
} from "./session-state";
import {
  clearShopSessionState,
  clearShopCsrfToken,
  emitShopSessionChanged,
  ensureShopCsrfToken,
  getShopCsrfToken,
} from "./shop-session-state";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
const PUBLIC_ADMIN_AUTH_ENDPOINT = /^\/auth\/(login|forgot-password|reset-password)(?:\/|$)/;
const PUBLIC_SHOP_AUTH_ENDPOINT = /^\/shop\/auth\/(login|register|forgot-password|reset-password)(?:\/|$)/;

/** Respuesta exitosa canónica del backend. */
export type ApiOk<T> = { success: true; data: T };
/** Forma de error serializada por el backend. */
export type ApiErr = { success: false; error?: string; message?: string; details?: unknown };

/** Error HTTP normalizado conservando código y detalles seguros de la API. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Modo de autenticación usado por una llamada. */
export type ApiAuthMode = "admin" | "shop" | "none";

/** Opciones HTTP extendidas con selección explícita del modo de sesión. */
export type ApiRequestOptions = RequestInit & {
  token?: string | null;
  auth?: ApiAuthMode;
  skipCsrf?: boolean;
};

function resolveApiUrl(path: string): string {
  const trimmedPath = path.trim();
  if (!trimmedPath.startsWith("/") || trimmedPath.startsWith("//")) {
    throw new Error("La ruta de API debe ser relativa y comenzar con '/'.");
  }
  return `${API_BASE}${trimmedPath}`;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const raw = await response.text();
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new ApiError("La API devolvió un cuerpo que no es JSON válido.", response.status);
  }
}

function isMutation(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

/** Revoca únicamente la sesión cuyo modo recibió un 401 y notifica a su UI. */
function notifyUnauthorized(path: string, mode: ApiAuthMode, status: number): void {
  if (status !== 401) return;
  if (mode === "admin") {
    if (PUBLIC_ADMIN_AUTH_ENDPOINT.test(path)) return;
    clearSessionState();
    clearCsrfToken();
    if (typeof window !== "undefined") window.dispatchEvent(new Event("unauthorized"));
    return;
  }
  if (mode === "shop" && !PUBLIC_SHOP_AUTH_ENDPOINT.test(path)) {
    clearShopSessionState();
    emitShopSessionChanged();
  }
}

async function requestCsrfToken(): Promise<string> {
  const response = await fetch(resolveApiUrl("/auth/csrf"), {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const body = await parseBody(response);
  if (!response.ok) {
    // Tras recargar, la primera mutación pide CSRF: si la cookie ya expiró, este 401 es la
    // primera señal de sesión vencida y debe cerrar la sesión igual que cualquier otra llamada admin.
    handleError("/auth/csrf", "admin", response, body);
  }
  const data = body && typeof body === "object" && "success" in body
    ? (body as ApiOk<{ csrfToken?: unknown }>).data
    : body;
  const token = data && typeof data === "object" && "csrfToken" in data
    ? (data as { csrfToken?: unknown }).csrfToken
    : undefined;
  if (typeof token !== "string" || token.length === 0) {
    throw new ApiError("La API no devolvió un token CSRF válido.", response.status);
  }
  return token;
}

/** Recupera el CSRF de tienda usando la cookie de sesión correspondiente. */
async function requestShopCsrfToken(): Promise<string> {
  const path = "/shop/auth/csrf";
  const response = await fetch(resolveApiUrl(path), {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const body = await parseBody(response);
  if (!response.ok) handleError(path, "shop", response, body);
  const data = body && typeof body === "object" && "success" in body
    ? (body as ApiOk<{ csrfToken?: unknown }>).data
    : body;
  const token = data && typeof data === "object" && "csrfToken" in data
    ? (data as { csrfToken?: unknown }).csrfToken
    : undefined;
  if (typeof token !== "string" || token.length === 0) {
    throw new ApiError("La API no devolvió un token CSRF de tienda válido.", response.status);
  }
  return token;
}

function handleError(path: string, mode: ApiAuthMode, response: Response, body: unknown): never {
  notifyUnauthorized(path, mode, response.status);
  const error = body as ApiErr | undefined;
  throw new ApiError(
    error?.message ?? `Error HTTP ${response.status}`,
    response.status,
    error?.error,
    error?.details,
  );
}

/**
 * Ejecuta una petición binaria autenticada por cookie para descargas admin.
 * @param path - Ruta relativa del backend.
 * @param options - Opciones de `fetch` adicionales.
 * @returns Respuesta HTTP sin consumir el cuerpo binario.
 * @throws {ApiError} Si la API responde con error, incluyendo 401.
 */
export async function fetchAdminResponse(path: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(resolveApiUrl(path), { ...options, credentials: "include" });
  if (!response.ok) {
    let body: unknown;
    try { body = await response.clone().json(); } catch { body = undefined; }
    handleError(path, "admin", response, body);
  }
  return response;
}

/**
 * Fetch JSON con cookies admin, cookies de tienda o sin autenticación.
 * Las mutaciones autenticadas aseguran CSRF en memoria y un `CSRF_INVALID` se reintenta
 * una vez: el middleware rechazó la petición antes de ejecutar el handler, por
 * lo que no hubo efecto que pudiera duplicarse.
 */
async function apiRequestInternal<TResponse>(
  path: string,
  options: ApiRequestOptions,
  csrfRetried: boolean,
): Promise<TResponse> {
  const { token, auth, headers, skipCsrf, ...requestOptions } = options;
  const authMode = auth ?? (token === null ? "none" : "admin");
  const method = (requestOptions.method ?? "GET").toUpperCase();
  const isPublicAuthEndpoint = authMode === "admin"
    ? PUBLIC_ADMIN_AUTH_ENDPOINT.test(path)
    : authMode === "shop" && PUBLIC_SHOP_AUTH_ENDPOINT.test(path);
  const csrfRequired = !skipCsrf && isMutation(method) && !isPublicAuthEndpoint &&
    (authMode === "admin" || authMode === "shop");
  const csrfToken = authMode === "admin" ? getCsrfToken() : getShopCsrfToken();
  if (csrfRequired && !csrfToken) {
    if (authMode === "admin") await ensureCsrfToken(requestCsrfToken);
    else await ensureShopCsrfToken(requestShopCsrfToken);
  }

  // Las cabeceras de sesión se fijan después de las del llamador para que no puedan sobrescribirse.
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  if (requestOptions.body) requestHeaders.set("Content-Type", "application/json");
  requestHeaders.delete("Authorization");
  if (csrfRequired) {
    const csrf = authMode === "admin" ? getCsrfToken() : getShopCsrfToken();
    if (csrf) requestHeaders.set("X-CSRF-Token", csrf);
  }

  const response = await fetch(resolveApiUrl(path), {
    ...requestOptions,
    method,
    credentials: authMode === "admin" || authMode === "shop" ? "include" : "omit",
    headers: requestHeaders,
  });
  const body = await parseBody(response);

  if (!response.ok) {
    if (csrfRequired && response.status === 403 && (body as ApiErr | undefined)?.error === "CSRF_INVALID") {
      // Un solo reintento: si el token recién emitido también es rechazado, se propaga el 403.
      if (csrfRetried) handleError(path, authMode, response, body);
      if (authMode === "admin") {
        clearCsrfToken();
        await ensureCsrfToken(requestCsrfToken);
      } else {
        clearShopCsrfToken();
        await ensureShopCsrfToken(requestShopCsrfToken);
      }
      if (requestOptions.signal?.aborted) throw new ApiError("La petición fue cancelada.", 0);
      return apiRequestInternal<TResponse>(path, { ...options, method }, true);
    }
    handleError(path, authMode, response, body);
  }

  if (body && typeof body === "object" && "success" in body &&
      (body as { success: unknown }).success === true && "data" in body) {
    return (body as ApiOk<TResponse>).data;
  }
  return body as TResponse;
}

/** Ejecuta una petición JSON usando el modelo de sesión adecuado. */
export function apiRequest<TResponse>(path: string, options: ApiRequestOptions = {}): Promise<TResponse> {
  return apiRequestInternal(path, options, false);
}

/** Atajos HTTP conservando el contrato público existente del cliente. */
export const api = {
  get: <T>(path: string) => apiRequest<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};

/** Permite almacenar el CSRF recibido durante login sin exponer cookies. */
export { clearCsrfToken, getCsrfToken, setCsrfToken } from "./session-state";
