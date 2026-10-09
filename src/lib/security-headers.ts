/** Construcción determinista de cabeceras de seguridad y CSP por petición. */

function getOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try { return new URL(value).origin; } catch { return null; }
}

/** Lee únicamente orígenes HTTPS fijos para incorporarlos a `img-src`. */
function getConfiguredPublicImageOrigins(): string[] {
  return (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      try {
        const url = new URL(entry);
        if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
          return [];
        }
        return [url.origin];
      } catch {
        return [];
      }
    });
}

/** Construye CSP con nonce por petición; `unsafe-inline` nunca se usa en scripts. */
export function buildContentSecurityPolicy(
  environment = process.env.NODE_ENV ?? "development",
  apiUrl = process.env.NEXT_PUBLIC_API_URL,
  nonce?: string,
): string {
  const apiOrigin = getOrigin(apiUrl);
  const connectSources = ["'self'", apiOrigin].filter(Boolean).join(" ");
  const imageSources = ["'self'", "data:", "blob:", apiOrigin, ...getConfiguredPublicImageOrigins()].filter(Boolean).join(" ");
  const scriptSources = ["'self'", nonce ? `'nonce-${nonce}'` : "'none'", "'strict-dynamic'", ...(environment === "development" ? ["'unsafe-eval'"] : [])].join(" ");
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

/** Genera cabeceras comunes; la CSP solo se agrega cuando existe nonce. */
export function buildSecurityHeaders(environment = process.env.NODE_ENV ?? "development", apiUrl?: string, nonce?: string) {
  const headers = [
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-XSS-Protection", value: "0" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ];
  if (nonce) headers.push({ key: "Content-Security-Policy", value: buildContentSecurityPolicy(environment, apiUrl, nonce) });
  if (environment === "production") headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
  return headers;
}
