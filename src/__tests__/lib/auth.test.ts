/**
 * Pruebas para funciones de autorización: roles y permisos.
 */

import { isWebUserRole, webUserRoles } from "@/lib/auth";

describe("Auth Utilities", () => {
  describe("isWebUserRole", () => {
    it("debe retornar true para roles válidos", () => {
      expect(isWebUserRole("ADMIN")).toBe(true);
      expect(isWebUserRole("ACCOUNTANT")).toBe(true);
      expect(isWebUserRole("OWNER")).toBe(true);
    });

    it("debe retornar false para roles inválidos", () => {
      expect(isWebUserRole("INVALID_ROLE")).toBe(false);
      expect(isWebUserRole("USER")).toBe(false);
      expect(isWebUserRole("")).toBe(false);
      expect(isWebUserRole("admin")).toBe(false);
    });

    it("debe tener todos los roles definidos", () => {
      expect(webUserRoles).toContain("ADMIN");
      expect(webUserRoles).toContain("ACCOUNTANT");
      expect(webUserRoles).toContain("OWNER");
      expect(webUserRoles).toHaveLength(3);
    });
  });
});
