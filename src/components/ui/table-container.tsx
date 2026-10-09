/**
 * Contenedor de tablas que limita el desplazamiento horizontal al propio listado.
 */

import * as React from "react";

import { cn } from "@/lib/utils";

/** Props del contenedor compatible con las clases BEM existentes. */
export type TableContainerProps = React.HTMLAttributes<HTMLDivElement>;

/** Evita que una tabla ancha provoque overflow horizontal en el documento. */
export const TableContainer = React.forwardRef<HTMLDivElement, TableContainerProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("table-container", className)} {...props} />
  ),
);
TableContainer.displayName = "TableContainer";
