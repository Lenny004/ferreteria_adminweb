import { deriveModelConstraints } from "@/lib/constraints/source";

/** Restricciones de cantidades y precios de las líneas del pedido de tienda. */
export const ShopOrderLineConstraints = deriveModelConstraints("ShopOrderLine");
