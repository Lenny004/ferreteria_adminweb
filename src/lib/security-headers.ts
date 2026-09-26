/** Construcción determinista de cabeceras de seguridad por entorno. */

function getOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Construye la política CSP sin comodines de origen.
 * `unsafe-eval` queda limitado a desarrollo por compatibilidad con la herramienta local.
 * `unsafe-inline` en `script-src` se mantiene hasta implementar nonces (M2) porque
 * Next.js inyecta scripts inline de hidratación.
 *
 * @param environment - Entorno de ejecución.
 * @param apiUrl - URL pública de la API, usada para conexiones e imágenes.
 * @returns Directivas CSP serializadas.
 */
export function buildContentSecurityPolicy(environment = process.env.NODE_ENV ?? "development", apiUrl = process.env.NEXT_PUBLIC_API_URL): string {
  const apiOrigin = getOrigin(apiUrl);
  const connectSources = ["'self'", apiOrigin].filter(Boolean).join(" ");
  const imageSources = ["'self'", "data:", "blob:", apiOrigin].filter(Boolean).join(" ");
  // Excepción justificada: Next.js App Router inyecta scripts inline de hidratación
  // (self.__next_f) que sin nonce quedarían bloqueados. Migrar a nonce vía proxy/middleware
  // obliga a render dinámico en todas las páginas; se deja como tarea de M2.
  const scriptSources = ["'self'", "'unsafe-inline'", ...(environment === "development" ? ["'unsafe-eval'"] : [])].join(" ");
  return [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imageSources}`,
    "font-src 'self' data:",
    `connect-src ${connectSources}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/**
 * Genera las cabeceras HTTP comunes del panel.
 *
 * @param environment - Entorno de ejecución.
 * @param apiUrl - URL pública de la API.
 * @returns Lista de cabeceras para Next.js.
 */
export function buildSecurityHeaders(environment = process.env.NODE_ENV ?? "development", apiUrl?: string) {
  const headers = [
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-XSS-Protection", value: "0" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(environment, apiUrl) },
  ];
  if (environment === "production") {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
  }
  return headers;
}
