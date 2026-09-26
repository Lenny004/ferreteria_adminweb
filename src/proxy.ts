/** Proxy de Next 16 que genera el nonce CSP y lo entrega al render server. */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildSecurityHeaders } from "@/lib/security-headers";

/** Mismo valor por defecto que `src/lib/api.ts`: sin él, `connect-src` bloquearía la API en local. */
const DEFAULT_API_URL = "http://localhost:3001/api/v1";

/** Añade un nonce único a CSP y a la cabecera interna `x-nonce`. */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  for (const header of buildSecurityHeaders(process.env.NODE_ENV, process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL, nonce)) {
    response.headers.set(header.key, header.value);
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
