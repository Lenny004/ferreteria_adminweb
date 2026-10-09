/** Estado vacío accesible para consultas sin resultados. */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Props del estado vacío. */
export type EmptyStateProps = {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** Informa que no hay registros y permite ofrecer una acción para crear el primero. */
export function EmptyState({
  title = "No hay registros para mostrar",
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2 py-8 text-center", className)} role="status" aria-live="polite">
      <p className="font-medium text-foreground">{title}</p>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
