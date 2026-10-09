/**
 * Utilidades para aceptar imágenes remotas solo desde orígenes explícitos y HTTPS.
 */

const DEFAULT_API_URL = "http://localhost:3001/api/v1";

/**
 * Lee la lista opcional de orígenes de imágenes de demostración.
 * Se ignoran URLs no HTTPS, con rutas o con comodines.
 *
 * @param value - Lista separada por comas, normalmente `NEXT_PUBLIC_IMAGE_HOSTS`.
 * @returns Orígenes HTTPS aptos para CSP y `remotePatterns`.
 */
export function getConfiguredPublicImageOrigins(value = process.env.NEXT_PUBLIC_IMAGE_HOSTS): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      try {
        const url = new URL(entry);
        if (
          url.protocol !== "https:"
          || url.hostname.includes("*")
          || url.pathname !== "/"
          || url.search
          || url.hash
          || url.username
          || url.password
        ) {
          return [];
        }
        return [url.origin];
      } catch {
        return [];
      }
    });
}

/**
 * Comprueba si una URL de imagen es local, del API configurado o de un host demo permitido.
 *
 * @param value - URL recibida desde el catálogo.
 * @returns `true` cuando el navegador puede intentar cargar la imagen.
 */
export function isAllowedImageSource(value: string): boolean {
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).origin;
    return url.origin === apiOrigin || getConfiguredPublicImageOrigins().includes(url.origin);
  } catch {
    return false;
  }
}
