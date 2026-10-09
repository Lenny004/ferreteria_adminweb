import { deriveModelConstraints } from "@/lib/constraints/source";

/** Restricciones derivadas para cabeceras de conteos de inventario. */
export const InventoryCountConstraints = deriveModelConstraints("InventoryCount");

/** Restricciones derivadas para líneas de conteos de inventario. */
export const InventoryCountLineConstraints = deriveModelConstraints("InventoryCountLine");
