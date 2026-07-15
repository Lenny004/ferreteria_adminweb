/**
 * Utilidades de presentación compartidas (Tailwind / className).
 * Independiente de entidades de negocio.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases CSS con resolución de conflictos Tailwind.
 * Preferir sobre concatenación manual en componentes UI.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
