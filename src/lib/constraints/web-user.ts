import { deriveModelConstraints } from "@/lib/constraints/source";

/** Restricciones derivadas para el usuario web autenticado. */
export const WebUserConstraints = deriveModelConstraints("WebUser");

/** Regla de autenticación del API para nuevas contraseñas administrativas. */
export const AdminPasswordConstraints = {
  ...WebUserConstraints.passwordHash,
  minLength: 8,
  type: "password" as const,
  inputMode: "text" as const,
};
