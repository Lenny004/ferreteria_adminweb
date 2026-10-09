/**
 * Insignia de estado que consume el mapa compartido de variantes y etiquetas.
 */

import type { BadgeProps } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { getStatusLabel, getStatusVariant } from "@/lib/status-variants";

/** Props de StatusBadge; admite estados desconocidos para tolerar nuevas respuestas del backend. */
export type StatusBadgeProps = Omit<BadgeProps, "children" | "variant"> & {
  status: string;
  label?: string;
};

/** Muestra el texto en español y la variante semántica de un estado de negocio. */
export function StatusBadge({ status, label, ...props }: StatusBadgeProps) {
  return (
    <Badge variant={getStatusVariant(status)} {...props}>
      {label ?? getStatusLabel(status)}
    </Badge>
  );
}
