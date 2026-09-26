/**
 * Configuración de permisos por rol.
 * Define qué roles pueden acceder a qué rutas del panel administrativo.
 */

import type { WebUserRole } from "./auth";

export type RoutePermission = {
  path: string;
  allowedRoles: WebUserRole[];
  description?: string;
};

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  {
    path: "/dashboard",
    allowedRoles: ["ADMIN", "ACCOUNTANT", "OWNER"],
    description: "Panel principal",
  },
  {
    path: "/empleados",
    allowedRoles: ["ADMIN", "OWNER"],
    description: "Gestión de empleados",
  },
  {
    path: "/planilla",
    allowedRoles: ["ADMIN", "OWNER"],
    description: "Módulo de planilla",
  },
  {
    path: "/fiscal",
    allowedRoles: ["ADMIN", "ACCOUNTANT", "OWNER"],
    description: "Módulo fiscal",
  },
  {
    path: "/inventario",
    allowedRoles: ["ADMIN", "OWNER"],
    description: "Gestión de inventario",
  },
  {
    path: "/compras",
    allowedRoles: ["ADMIN", "OWNER"],
    description: "Módulo de compras",
  },
  {
    path: "/clientes",
    allowedRoles: ["ADMIN", "OWNER"],
    description: "Gestión de clientes",
  },
  {
    path: "/rrhh",
    allowedRoles: ["ADMIN", "OWNER"],
    description: "Recursos Humanos",
  },
  {
    path: "/reportes",
    allowedRoles: ["ADMIN", "ACCOUNTANT", "OWNER"],
    description: "Reportes",
  },
  {
    path: "/perfil",
    allowedRoles: ["ADMIN", "ACCOUNTANT", "OWNER"],
    description: "Perfil de usuario",
  },
  {
    path: "/mensajes-contacto",
    allowedRoles: ["ADMIN", "OWNER"],
    description: "Mensajes de contacto",
  },
  {
    path: "/importaciones",
    allowedRoles: ["ADMIN", "OWNER"],
    description: "Importaciones",
  },
];

export function canAccessRoute(pathname: string, userRole: WebUserRole): boolean {
  const permission = ROUTE_PERMISSIONS.find((p) => pathname.startsWith(p.path));
  
  if (!permission) {
    return true;
  }

  return permission.allowedRoles.includes(userRole);
}

export function getRestrictedPaths(userRole: WebUserRole): string[] {
  return ROUTE_PERMISSIONS
    .filter((p) => !p.allowedRoles.includes(userRole))
    .map((p) => p.path);
}
