/**
 * Mapa único de variantes y textos para los estados usados en AdminWeb y tienda.
 */

import type { BadgeProps } from "@/components/ui/badge";

/** Variante visual semántica por estado de negocio. */
export const STATUS_VARIANT = {
  PENDIENTE: "warning",
  EN_REVISION: "warning",
  EN_VERIFICACION: "warning",
  ABIERTO: "warning",
  BORRADOR: "muted",
  NEW: "warning",
  APROBADA: "success",
  PAGADA: "success",
  PAGADO: "success",
  COMPLETADO: "success",
  APLICADO: "success",
  CONFIRMADA: "default",
  LISTA_RETIRO: "default",
  RECIBIDA: "success",
  ENTREGADA: "success",
  ACTIVA: "success",
  EN_GOCE: "success",
  CERRADA: "muted",
  CERRADO: "muted",
  REEMBOLSADO: "muted",
  READ: "muted",
  ARCHIVED: "muted",
  CANCELADA: "danger",
  CANCELADO: "danger",
  RECHAZADA: "danger",
  ANULADA: "danger",
  ERROR: "danger",
  FALLIDO: "danger",
  VENCIDO: "danger",
} as const satisfies Record<string, NonNullable<BadgeProps["variant"]>>;

/** Texto legible en español para los estados técnicos del backend. */
export const STATUS_LABEL = {
  PENDIENTE: "Pendiente",
  EN_REVISION: "En revisión",
  EN_VERIFICACION: "En verificación",
  ABIERTO: "Abierto",
  BORRADOR: "Borrador",
  NEW: "Nuevo",
  APROBADA: "Aprobada",
  PAGADA: "Pagada",
  PAGADO: "Pagado",
  COMPLETADO: "Completado",
  APLICADO: "Aplicado",
  CONFIRMADA: "Confirmada",
  LISTA_RETIRO: "Lista para retiro",
  RECIBIDA: "Recibida",
  ENTREGADA: "Entregada",
  ACTIVA: "Activa",
  EN_GOCE: "En goce",
  CERRADA: "Cerrada",
  CERRADO: "Cerrado",
  REEMBOLSADO: "Reembolsado",
  READ: "Leído",
  ARCHIVED: "Archivado",
  CANCELADA: "Cancelada",
  CANCELADO: "Cancelado",
  RECHAZADA: "Rechazada",
  ANULADA: "Anulada",
  ERROR: "Error",
  FALLIDO: "Fallido",
  VENCIDO: "Vencido",
} as const;

/** Alias plural para consumidores que tratan las etiquetas como un catálogo. */
export const STATUS_LABELS = STATUS_LABEL;

/** Obtiene una variante segura para un estado desconocido. */
export function getStatusVariant(status: string): NonNullable<BadgeProps["variant"]> {
  return STATUS_VARIANT[status.trim().toUpperCase() as keyof typeof STATUS_VARIANT] ?? "muted";
}

/** Convierte un estado no registrado en una etiqueta legible sin mostrar guiones técnicos. */
export function getStatusLabel(status: string): string {
  const normalized = status.trim().toUpperCase() as keyof typeof STATUS_LABEL;
  return STATUS_LABEL[normalized] ?? status.toLowerCase().replaceAll("_", " ");
}
