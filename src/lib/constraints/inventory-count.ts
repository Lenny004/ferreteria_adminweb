import { deriveModelConstraints } from "@/lib/constraints/source";

/** Restricciones derivadas para cabeceras de conteos de inventario. */
export const InventoryCountConstraints = deriveModelConstraints("InventoryCount");

/** Restricciones derivadas para líneas de conteos de inventario. */
export const InventoryCountLineConstraints = deriveModelConstraints("InventoryCountLine");

/** Límite funcional del motivo opcional para cancelar un conteo. */
export const InventoryCountCancelReasonConstraints = {
  maxLength: 300,
  type: "text",
  inputMode: "text",
} as const;
