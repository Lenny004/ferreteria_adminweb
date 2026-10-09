import { deriveModelConstraints } from "@/lib/constraints/source";

/** Restricciones derivadas para pedidos de tienda administrados desde AdminWeb. */
export const ShopOrderConstraints = deriveModelConstraints("ShopOrder");

/** Restricciones derivadas para pagos de pedidos de tienda. */
export const ShopPaymentConstraints = deriveModelConstraints("ShopPayment");

/** Regla funcional del checkout: el envío requiere una dirección identificable. */
export const ShopShippingAddressConstraints = { minLength: 10 } as const;
