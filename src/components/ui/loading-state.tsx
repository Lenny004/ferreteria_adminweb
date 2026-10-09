/** Estado de carga accesible para consultas y listados. */

import { cn } from "@/lib/utils";

/** Props del estado de carga. */
export type LoadingStateProps = {
  label?: string;
  className?: string;
};

/** Comunica una carga activa a lectores de pantalla sin alterar el flujo del listado. */
export function LoadingState({ label = "Cargando…", className }: LoadingStateProps) {
  return (
    <div
      className={cn("flex items-center gap-2 py-4 text-sm text-muted-foreground", className)}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
