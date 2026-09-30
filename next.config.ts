import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/lib/security-headers";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
const apiOrigin = new URL(apiUrl);

/** Configuración de Next.js con cabeceras CSP y origen de imágenes de la API. */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{
      protocol: apiOrigin.protocol.replace(":", "") as "http" | "https",
      hostname: apiOrigin.hostname,
      port: apiOrigin.port,
    }],
  },
  async headers() {
    return [{ source: "/:path*", headers: buildSecurityHeaders(process.env.NODE_ENV, apiUrl) }];
  },
};

export default nextConfig;
