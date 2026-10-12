import { deriveModelConstraints } from "@/lib/constraints/source";

/** Restricciones del usuario administrativo y sus credenciales de acceso. */
export const WebUserConstraints = {
  ...deriveModelConstraints("WebUser"),
};

/** Reglas de Zod para contraseñas de usuarios administrativos. */
export const WebUserPasswordConstraints = { minLength: 8, maxLength: 128 } as const;

/** Regla mínima para la contraseña vigente enviada al cambio de clave. */
export const WebUserCurrentPasswordConstraints = { minLength: 1, maxLength: 128 } as const;
