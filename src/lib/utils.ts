/**
 * Utilidades de presentación compartidas (Tailwind / className).
 * Independiente de entidades de negocio.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export { formatDate, formatDateTime, formatMoney, formatNumber } from "@/lib/format";

/**
 * Combina clases CSS con resolución de conflictos Tailwind.
 *
 * @param inputs - Clases condicionales y valores compatibles con clsx.
 * @returns Cadena de clases normalizada.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
