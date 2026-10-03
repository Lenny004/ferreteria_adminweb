/**
 * Pruebas para el sistema de permisos por rol.
 */

import { canAccessRoute, getRestrictedPaths } from "@/lib/role-permissions";

describe("Role Permissions", () => {
  describe("canAccessRoute", () => {
    it("debe permitir acceso a dashboard para todos los roles autorizados", () => {
      expect(canAccessRoute("/dashboard", "ADMIN")).toBe(true);
      expect(canAccessRoute("/dashboard", "ACCOUNTANT")).toBe(true);
      expect(canAccessRoute("/dashboard", "OWNER")).toBe(true);
    });

    it("debe permitir acceso a empleados solo para ADMIN y OWNER", () => {
      expect(canAccessRoute("/empleados", "ADMIN")).toBe(true);
      expect(canAccessRoute("/empleados", "OWNER")).toBe(true);
      expect(canAccessRoute("/empleados", "ACCOUNTANT")).toBe(false);
    });

    it("debe permitir pedidos de tienda solo para ADMIN y OWNER", () => {
      expect(canAccessRoute("/pedidos-tienda", "ADMIN")).toBe(true);
      expect(canAccessRoute("/pedidos-tienda/abc", "OWNER")).toBe(true);
      expect(canAccessRoute("/pedidos-tienda", "ACCOUNTANT")).toBe(false);
    });

    it("debe permitir acceso a fiscal para ADMIN, ACCOUNTANT y OWNER", () => {
      expect(canAccessRoute("/fiscal/libros-iva", "ADMIN")).toBe(true);
      expect(canAccessRoute("/fiscal/libros-iva", "ACCOUNTANT")).toBe(true);
      expect(canAccessRoute("/fiscal/libros-iva", "OWNER")).toBe(true);
    });

    it("debe usar la regla más específica para conteos físicos", () => {
      expect(canAccessRoute("/inventario/conteos", "ACCOUNTANT")).toBe(true);
      expect(canAccessRoute("/inventario/conteos/abc/export", "ACCOUNTANT")).toBe(true);
      expect(canAccessRoute("/inventario", "ACCOUNTANT")).toBe(false);
      expect(canAccessRoute("/inventario/otro", "ACCOUNTANT")).toBe(false);
    });

    it("debe permitir acceso a planilla solo para ADMIN y OWNER", () => {
      expect(canAccessRoute("/planilla/corridas", "ADMIN")).toBe(true);
      expect(canAccessRoute("/planilla/corridas", "OWNER")).toBe(true);
      expect(canAccessRoute("/planilla/corridas", "ACCOUNTANT")).toBe(false);
    });

    it("debe denegar rutas no configuradas y coincidencias parciales", () => {
      expect(canAccessRoute("/ruta-no-configurada", "ADMIN")).toBe(false);
      expect(canAccessRoute("/planillaX", "ADMIN")).toBe(false);
      expect(canAccessRoute("/planilla/corridas/1/export", "ADMIN")).toBe(true);
    });

    it("debe manejar rutas anidadas correctamente", () => {
      expect(canAccessRoute("/empleados/123/ficha", "ADMIN")).toBe(true);
      expect(canAccessRoute("/empleados/123/ficha", "ACCOUNTANT")).toBe(false);
    });
  });

  describe("getRestrictedPaths", () => {
    it("debe retornar rutas restringidas para ACCOUNTANT", () => {
      const restricted = getRestrictedPaths("ACCOUNTANT");
      
      expect(restricted).toContain("/empleados");
      expect(restricted).toContain("/planilla");
      expect(restricted).toContain("/rrhh");
      expect(restricted).not.toContain("/dashboard");
      expect(restricted).not.toContain("/fiscal");
    });

    it("debe retornar array vacío para OWNER", () => {
      const restricted = getRestrictedPaths("OWNER");
      expect(restricted).toEqual([]);
    });

    it("debe retornar array vacío para ADMIN", () => {
      const restricted = getRestrictedPaths("ADMIN");
      expect(restricted).toEqual([]);
    });
  });
});
