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

/** Moneda USD (El Salvador) para tablas y KPIs. */
export function formatMoney(value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("es-SV", { style: "currency", currency: "USD" });
}

/** Fecha corta es-SV. Acepta ISO o `YYYY-MM-DD`. */
export function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-SV");
}

/** Fecha + hora es-SV. */
export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("es-SV");
}
