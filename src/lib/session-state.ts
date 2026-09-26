/**
 * Estado efímero de la sesión administrativa y del token CSRF.
 * La autenticación vive en cookies httpOnly; JavaScript solo conserva el perfil
 * validado por `/auth/me` y el token CSRF necesario para el double-submit.
 */

import type { SessionUser } from "@/lib/auth";

const LEGACY_ACCESS_TOKEN_KEY = "ferreteria_access_token";
const LEGACY_TOKEN_EXPIRY_KEY = "ferreteria_token_expiry";

let sessionUser: SessionUser | null = null;
let csrfToken: string | null = null;
let csrfRequestInFlight: Promise<string> | null = null;

/** Devuelve el usuario administrativo validado en memoria. */
export function getSessionUser(): SessionUser | null {
  return sessionUser;
}

/** Actualiza el perfil administrativo validado por `/auth/me` o login. */
export function setSessionUser(user: SessionUser | null): void {
  sessionUser = user;
}

/** Devuelve el token CSRF vigente en memoria, nunca desde una cookie. */
export function getCsrfToken(): string | null {
  return csrfToken;
}

/** Guarda el token CSRF recibido del backend en memoria. */
export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

/** Limpia el token CSRF y cancela el valor cacheado de la sesión. */
export function clearCsrfToken(): void {
  csrfToken = null;
}

/** Limpia el perfil administrativo mantenido por el cliente. */
export function clearSessionState(): void {
  sessionUser = null;
}

/**
 * Elimina las claves del modelo JWT anterior al cargar la aplicación.
 * La migración es deliberadamente destructiva solo para esas dos claves obsoletas.
 */
export function migrateLegacySessionStorage(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(LEGACY_TOKEN_EXPIRY_KEY);
}

/**
 * Recupera el CSRF tras una recarga y deduplica llamadas concurrentes.
 * @param request - Función que ejecuta GET `/auth/csrf`.
 * @returns Token CSRF almacenado en memoria.
 */
export function ensureCsrfToken(request: () => Promise<string>): Promise<string> {
  if (csrfToken) return Promise.resolve(csrfToken);
  if (!csrfRequestInFlight) {
    csrfRequestInFlight = request()
      .then((token) => {
        setCsrfToken(token);
        return token;
      })
      .finally(() => {
        csrfRequestInFlight = null;
      });
  }
  return csrfRequestInFlight;
}

