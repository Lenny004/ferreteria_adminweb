"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

export interface QueryErrorStateProps {
  /** Error producido por la consulta; solo se muestra el mensaje seguro de la API. */
  error: unknown;
  /** Reintenta la consulta que falló. */
  onRetry: () => void;
  /** Título visible del estado de error. */
  title?: string;
  /** Indica que el reintento está en curso. */
  isRetrying?: boolean;
  /** Reduce el espaciado para usar el estado dentro de una tabla o fila. */
  compact?: boolean;
}

/**
 * Estado reutilizable para consultas fallidas, sin exponer trazas ni detalles técnicos.
 *
 * @param error - Error recibido por TanStack Query.
 * @param onRetry - Callback que vuelve a ejecutar la consulta.
 * @param title - Título opcional del aviso.
 * @param isRetrying - Deshabilita el botón mientras se reintenta.
 * @param compact - Usa una presentación reducida para espacios estrechos.
 */
export function QueryErrorState({
  error,
  onRetry,
  title = "No se pudieron cargar los datos",
  isRetrying = false,
  compact = false,
}: QueryErrorStateProps) {
  const detail = error instanceof ApiError ? error.message : "Intenta de nuevo o contacta al administrador.";

  return (
    <div
      className={compact ? "flex items-center justify-between gap-3 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm" : "flex flex-col items-start gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4"}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
        <div>
          <p className="font-medium text-danger">{title}</p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? "Reintentando…" : "Reintentar"}
      </Button>
    </div>
  );
}
