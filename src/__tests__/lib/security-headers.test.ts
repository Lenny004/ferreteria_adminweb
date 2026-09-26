import { buildContentSecurityPolicy, buildSecurityHeaders } from "@/lib/security-headers";

describe("security headers", () => {
  it("limita eval a desarrollo y deriva los orígenes de la API", () => {
    const development = buildContentSecurityPolicy("development", "https://api.example.test/api/v1");
    const production = buildContentSecurityPolicy("production", "https://api.example.test/api/v1");
    expect(development).toContain("'unsafe-eval'");
    expect(production).not.toContain("'unsafe-eval'");
    expect(production).toContain("script-src 'self' 'unsafe-inline'");
    expect(production).not.toMatch(/https:(\s|;|$)/);
    expect(production).toContain("connect-src 'self' https://api.example.test");
    expect(production).toContain("img-src 'self' data: blob: https://api.example.test");
    expect(production).toContain("frame-ancestors 'none'");
    expect(production).toContain("object-src 'none'");
  });

  it("solo añade HSTS en producción", () => {
    expect(buildSecurityHeaders("development").some((header) => header.key === "Strict-Transport-Security")).toBe(false);
    expect(buildSecurityHeaders("production").some((header) => header.key === "Strict-Transport-Security")).toBe(true);
  });
});
