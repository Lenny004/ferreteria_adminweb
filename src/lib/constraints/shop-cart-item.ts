import { deriveModelConstraints } from "@/lib/constraints/source";

/** Restricciones de cantidades capturadas en el carrito de tienda. */
export const ShopCartItemConstraints = deriveModelConstraints("ShopCartItem");
