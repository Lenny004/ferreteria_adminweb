/**
 * Gestión centralizada del token de acceso con expiración automática.
 * Aísla la lógica de persistencia para facilitar migración futura a cookies.
 */

const TOKEN_KEY = "ferreteria_access_token";
const TOKEN_EXPIRY_KEY = "ferreteria_token_expiry";
const TOKEN_LIFETIME_MS = 8 * 60 * 60 * 1000;

let accessTokenInMemory: string | null = null;
let tokenExpiryInMemory: number | null = null;

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  if (accessTokenInMemory && tokenExpiryInMemory) {
    if (Date.now() >= tokenExpiryInMemory) {
      clearAccessToken();
      window.dispatchEvent(new Event("access-token-expired"));
      return null;
    }
    return accessTokenInMemory;
  }

  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const expiryStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token || !expiryStr) {
      clearAccessToken();
      return null;
    }

    const expiry = parseInt(expiryStr, 10);
    if (Date.now() >= expiry) {
      clearAccessToken();
      window.dispatchEvent(new Event("access-token-expired"));
      return null;
    }

    accessTokenInMemory = token;
    tokenExpiryInMemory = expiry;
    return token;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error al leer el token:", err);
    }
    clearAccessToken();
    return null;
  }
}

export function setAccessToken(token: string | null): void {
  accessTokenInMemory = token;
  
  if (typeof window === "undefined") return;

  try {
    if (token) {
      const expiry = Date.now() + TOKEN_LIFETIME_MS;
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

export function getTokenExpiry(): number | null {
  if (typeof window === "undefined") return null;

  if (tokenExpiryInMemory) {
    return tokenExpiryInMemory;
  }

  try {
    const expiryStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    if (expiryStr) {
      tokenExpiryInMemory = parseInt(expiryStr, 10);
      return tokenExpiryInMemory;
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error al leer la expiración del token:", err);
    }
  }

  return null;
}

export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return Date.now() >= expiry;
}
