import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

/** Props del estado de error reutilizable para consultas y listados. */
export type ErrorStateProps = {
  /** Título funcional que se muestra al usuario. */
  title?: string;
  /** Explicación opcional del problema o del siguiente paso. */
  description?: ReactNode;
  /** Acción opcional para repetir la operación fallida. */
  onRetry?: () => void;
};

/**
 * Comunica un fallo de carga sin exponer detalles técnicos y permite reintentar.
 *
 * @param props - Título, descripción y acción opcional del estado de error.
 * @returns Aviso accesible con el botón de reintento cuando se proporciona.
 */
export function ErrorState({
  title = "No se pudieron cargar los datos",
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4" role="alert">
      <div>
        <p className="font-medium text-danger">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}
