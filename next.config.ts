import type { NextConfig } from "next";
import { getConfiguredPublicImageOrigins } from "./src/lib/image-hosts";
import { buildSecurityHeaders } from "./src/lib/security-headers";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
const apiOrigin = new URL(apiUrl);
const configuredImagePatterns = getConfiguredPublicImageOrigins().map((origin) => {
  const imageOrigin = new URL(origin);
  return { protocol: "https" as const, hostname: imageOrigin.hostname, port: imageOrigin.port };
});

/** Configuración de Next.js con cabeceras CSP y origen de imágenes de la API. */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{
      protocol: apiOrigin.protocol.replace(":", "") as "http" | "https",
      hostname: apiOrigin.hostname,
      port: apiOrigin.port,
    }, ...configuredImagePatterns],
  },
  async headers() {
    return [{ source: "/:path*", headers: buildSecurityHeaders(process.env.NODE_ENV, apiUrl) }];
  },
};

export default nextConfig;
