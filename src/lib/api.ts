/**
 * Cliente HTTP hacia ferreteria_backend (`/api/v1`).
 * Token de acceso en memoria + sessionStorage (MVP sin refresh cookie).
 * Respuestas canónicas: `{ success: true, data: T }`.
 */

import { clearAccessToken, getAccessToken as getToken, setAccessToken as setToken } from "./token-manager";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

/** Respuesta exitosa canónica del backend. */
export type ApiOk<T> = { success: true; data: T };
/** Forma de error serializada por el backend. */
export type ApiErr = {
  success: false;
  error?: string;
  message?: string;
  details?: unknown;
};

export class ApiError extends Error {
  /** Crea un error HTTP conservando código y detalles seguros de la API. */
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

function resolveApiUrl(path: string): string {
  const trimmedPath = path.trim();
  if (!trimmedPath.startsWith("/") || trimmedPath.startsWith("//")) {
    throw new Error("La ruta de API debe ser relativa y comenzar con '/'.");
  }
  return `${API_BASE}${trimmedPath}`;
}

export function getAccessToken(): string | null {
  return getToken();
}

/**
 * Actualiza la sesión administrativa local.
 * Hasta M2 el token permanece en sessionStorage por compatibilidad con el contrato actual.
 *
 * @param token - Token administrativo o `null` para cerrar sesión.
 * @returns No devuelve un valor.
 */
export function setAccessToken(token: string | null): void {
  if (token) {
    setToken(token);
  } else {
    clearAccessToken();
  }
}

export type ApiAuthMode = "admin" | "shop" | "none";

export type ApiRequestOptions = RequestInit & {
  token?: string | null;
  auth?: ApiAuthMode;
};

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

/**
 * Fetch JSON autenticado. Desenvuelve `{ success, data }` cuando aplica.
 */
export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const { token, auth, headers, ...requestOptions } = options;
  const bearer = token === undefined ? getAccessToken() : token;
  const authMode = auth ?? (token === null ? "none" : "admin");

  const response = await fetch(resolveApiUrl(path), {
    ...requestOptions,
    headers: {
      Accept: "application/json",
      ...(requestOptions.body ? { "Content-Type": "application/json" } : {}),
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...headers,
    },
  });

  const body = await parseBody(response);

  if (!response.ok) {
    const isAuthEndpoint = /^\/auth\/(login|forgot-password|reset-password)(?:\/|$)/.test(path);
    if (response.status === 401 && authMode === "admin" && bearer && !isAuthEndpoint && typeof window !== "undefined") {
      clearAccessToken();
      window.dispatchEvent(new Event("unauthorized"));
    }
    
    const err = body as ApiErr | undefined;
    throw new ApiError(
      err?.message ?? `Error HTTP ${response.status}`,
      response.status,
      err?.error,
      err?.details,
    );
  }

  if (
    body &&
    typeof body === "object" &&
    "success" in body &&
    (body as { success: unknown }).success === true &&
    "data" in body
  ) {
    return (body as ApiOk<TResponse>).data;
  }

  return body as TResponse;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
