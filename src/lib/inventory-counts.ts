/** Reglas puras de presentación y validación para capturas de inventario. */

import type { WebUserRole } from "@/lib/auth";
import { formatNumber } from "@/lib/format";

function decimalNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Valida una cantidad contada con el límite de decimales del producto.
 * @param value - Texto escrito en el input numérico.
 * @param decimals - Decimales permitidos por la unidad de medida.
 * @returns Mensaje de validación o `null` si la cantidad es válida.
 */
export function validateCountedQuantity(value: string, decimals: number): string | null {
  const normalized = value.trim();
  if (!normalized) return "Ingresa una cantidad";
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return "Ingresa un número válido";
  const quantity = Number(normalized);
  if (!Number.isFinite(quantity) || quantity < 0) return "La cantidad debe ser mayor o igual a 0";
  const fraction = normalized.split(".")[1] ?? "";
  if (fraction.length > decimals) return `Admite máximo ${decimals} decimal${decimals === 1 ? "" : "es"}`;
  return null;
}

/**
 * Calcula la diferencia visible usando el stock congelado o, si aún no existe,
 * el stock actual del producto como vista previa.
 * @param countedQuantity - Cantidad capturada o escrita.
 * @param systemStockAtCount - Stock congelado por el backend al guardar.
 * @param currentStock - Stock vigente usado para la vista previa.
 * @returns Diferencia o `null` si falta una cantidad válida.
 */
export function calculateUiVariance(countedQuantity: string | number | null | undefined, systemStockAtCount: string | number | null | undefined, currentStock: string | number): number | null {
  const counted = decimalNumber(countedQuantity);
  const stock = decimalNumber(systemStockAtCount ?? currentStock);
  if (counted === null || stock === null) return null;
  return counted - stock;
}

/** Formatea una diferencia con signo para distinguir sobrantes y faltantes. */
export function formatVariance(value: string | number | null | undefined, decimals = 3): string {
  const parsed = decimalNumber(value);
  if (parsed === null) return "—";
  if (Object.is(parsed, -0) || parsed === 0) return "0";
  const formatted = formatNumber(Math.abs(parsed), decimals);
  return parsed > 0 ? `+${formatted}` : `-${formatted}`;
}

/** Devuelve la clase semántica para sobrante, faltante o diferencia cero. */
export function getVarianceClass(value: string | number | null | undefined): string {
  const parsed = decimalNumber(value);
  if (parsed === null || parsed === 0) return "text-muted-foreground";
  return parsed > 0 ? "text-success" : "text-danger";
}

/** Indica si el rol puede crear, capturar, aplicar o cancelar conteos. */
export function canWriteCounts(role: WebUserRole): boolean {
  return role === "ADMIN" || role === "OWNER";
}
