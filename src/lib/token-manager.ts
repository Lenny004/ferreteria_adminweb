/**
 * Gestión centralizada del token de acceso con expiración automática.
 * Aísla la lógica de persistencia para facilitar migración futura a cookies.
 */

const TOKEN_KEY = "ferreteria_access_token";
const TOKEN_EXPIRY_KEY = "ferreteria_token_expiry";
const TOKEN_LIFETIME_MS = 8 * 60 * 60 * 1000;

let accessTokenInMemory: string | null = null;
let tokenExpiryInMemory: number | null = null;

function decodeJwtExpiry(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="))) as {
      exp?: unknown;
    };
    return typeof decoded.exp === "number" && Number.isFinite(decoded.exp)
      ? decoded.exp * 1000
      : null;
  } catch {
    return null;
  }
}

function getStoredToken(): { token: string; expiry: number } | null {
  if (typeof window === "undefined") return null;

  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const storedExpiry = Number(sessionStorage.getItem(TOKEN_EXPIRY_KEY));
    const expiry = decodeJwtExpiry(token) ?? (Number.isFinite(storedExpiry) && storedExpiry > 0
      ? storedExpiry
      : Date.now() + TOKEN_LIFETIME_MS);
    return { token, expiry };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error al leer el token:", err);
    }
    return null;
  }
}

/**
 * Lee el token sin modificar almacenamiento ni emitir eventos.
 * Mantener esta función pura evita actualizaciones de React durante el render.
 *
 * @returns Token vigente o `null` si no existe o ya expiró.
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  const stored = accessTokenInMemory && tokenExpiryInMemory
    ? { token: accessTokenInMemory, expiry: tokenExpiryInMemory }
    : getStoredToken();
  if (!stored) return null;
  accessTokenInMemory = stored.token;
  tokenExpiryInMemory = stored.expiry;
  return Date.now() < stored.expiry ? stored.token : null;
}

/**
 * Persiste el JWT administrativo y notifica cambios de sesión.
 * El `exp` del JWT es la fuente primaria; las ocho horas solo respaldan tokens sin `exp`.
 *
 * @param token - JWT administrativo o `null` para cerrar sesión.
 */
export function setAccessToken(token: string | null): void {
  accessTokenInMemory = token;
  
  if (typeof window === "undefined") return;

  try {
    if (token) {
      const expiry = decodeJwtExpiry(token) ?? Date.now() + TOKEN_LIFETIME_MS;
      tokenExpiryInMemory = expiry;
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
      window.dispatchEvent(new Event("access-token-changed"));
    } else {
      clearAccessToken();
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error al guardar el token:", err);
    }
  }
}

/**
 * Elimina el token y su expiración de memoria y sessionStorage.
 *
 * @returns No devuelve un valor.
 */
export function clearAccessToken(): void {
  accessTokenInMemory = null;
  tokenExpiryInMemory = null;
  
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    window.dispatchEvent(new Event("access-token-changed"));
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error al limpiar el token:", err);
    }
  }
}

/**
 * Expira de forma explícita una sesión vencida desde un efecto o interceptor.
 * No debe invocarse durante el render de un componente.
 *
 * @returns `true` si encontró y limpió un token vencido.
 */
export function expireIfNeeded(): boolean {
  const hadToken = Boolean(accessTokenInMemory || getStoredToken()?.token);
  if (!hadToken || !isTokenExpired()) return false;
  clearAccessToken();
  if (typeof window !== "undefined") window.dispatchEvent(new Event("access-token-expired"));
  return true;
}

/**
 * Obtiene la fecha de expiración del token almacenado.
 *
 * @returns Timestamp de expiración en milisegundos o `null` si no hay token.
 */
export function getTokenExpiry(): number | null {
  if (typeof window === "undefined") return null;

  if (tokenExpiryInMemory) {
    return tokenExpiryInMemory;
  }

  try {
    const stored = getStoredToken();
    if (stored) {
      tokenExpiryInMemory = stored.expiry;
      return stored.expiry;
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error al leer la expiración del token:", err);
    }
  }

  return null;
}

/**
 * Comprueba localmente si el token está vencido.
 *
 * @returns `true` cuando no existe expiración o el timestamp ya pasó.
 */
export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return Date.now() >= expiry;
}
