/** Pruebas de CSP nonce y cabeceras de seguridad. */

import { buildContentSecurityPolicy, buildSecurityHeaders } from "@/lib/security-headers";

describe("security headers", () => {
  it("contiene nonce, strict-dynamic y nunca unsafe-inline en script-src", () => {
    const csp = buildContentSecurityPolicy("production", "https://api.example.test/api/v1", "nonce-value");
    expect(csp).toContain("script-src 'self' 'nonce-nonce-value' 'strict-dynamic'");
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(csp).toContain("connect-src 'self' https://api.example.test");
    expect(csp).toContain("img-src 'self' data: blob: https://api.example.test");
  });

  it("limita unsafe-eval a desarrollo y HSTS a producción", () => {
    expect(buildContentSecurityPolicy("development", undefined, "dev")).toContain("'unsafe-eval'");
    expect(buildContentSecurityPolicy("production", undefined, "prod")).not.toContain("'unsafe-eval'");
    expect(buildSecurityHeaders("development").some((header) => header.key === "Strict-Transport-Security")).toBe(false);
    expect(buildSecurityHeaders("production").some((header) => header.key === "Strict-Transport-Security")).toBe(true);
  });

  it("omite hosts con comodin de img-src", () => {
    const previousHosts = process.env.NEXT_PUBLIC_IMAGE_HOSTS;
    process.env.NEXT_PUBLIC_IMAGE_HOSTS = "https://*.example.test,https://images.example.test";

    try {
      const csp = buildContentSecurityPolicy("production", undefined, "nonce-value");
      const imageDirective = csp.split("; ").find((directive) => directive.startsWith("img-src ")) ?? "";
      expect(imageDirective).toContain("https://images.example.test");
      expect(imageDirective).not.toContain("https://*.example.test");
    } finally {
      if (previousHosts === undefined) {
        delete process.env.NEXT_PUBLIC_IMAGE_HOSTS;
      } else {
        process.env.NEXT_PUBLIC_IMAGE_HOSTS = previousHosts;
      }
    }
  });
});
