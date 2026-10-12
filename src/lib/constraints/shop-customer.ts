import { deriveModelConstraints } from "@/lib/constraints/source";

/** Restricciones del cliente de tienda y sus credenciales de acceso. */
export const ShopCustomerConstraints = {
  ...deriveModelConstraints("ShopCustomer"),
};

/** Reglas de Zod para contraseñas de clientes de tienda. */
export const ShopCustomerPasswordConstraints = { minLength: 8, maxLength: 128 } as const;

/** Reglas de entrada para confirmar la contraseña vigente del cliente. */
export const ShopCustomerCurrentPasswordConstraints = { minLength: 1, maxLength: 128 } as const;

/** Regla adicional del endpoint de registro para el nombre del cliente. */
export const ShopCustomerRegistrationNameConstraints = {
  ...ShopCustomerConstraints.fullName,
  minLength: 2,
} as const;
