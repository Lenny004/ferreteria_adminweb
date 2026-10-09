import { deriveModelConstraints } from "@/lib/constraints/source";

/** Restricciones derivadas para cabeceras de órdenes de compra. */
export const PurchaseOrderConstraints = deriveModelConstraints("PurchaseOrder");

/** Restricciones derivadas para líneas de órdenes de compra. */
export const PurchaseOrderDetailConstraints = deriveModelConstraints("PurchaseOrderDetail");
