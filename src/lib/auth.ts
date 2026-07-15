/**
 * Tipos y constantes de autenticación del panel AdminWeb.
 * Define los roles de WebUser (distintos del PIN de Employee en la caja WPF).
 */

/** Roles de WebUser con acceso al panel administrativo. */
export const webUserRoles = ["ADMIN", "ACCOUNTANT", "OWNER"] as const;

/** Rol autorizado para operar el AdminWeb. */
export type WebUserRole = (typeof webUserRoles)[number];

/**
 * Usuario de sesión del panel (identidad mínima para UI y autorización).
 * Corresponde a WebUser autenticado, no a la entidad Employee del POS.
 */
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: WebUserRole;
};

/**
 * Indica si el rol pertenece al catálogo permitido de WebUser.
 * Usar antes de renderizar rutas sensibles (Payroll, fiscal, RRHH).
 */
export function isWebUserRole(role: string): role is WebUserRole {
  return (webUserRoles as readonly string[]).includes(role);
}
