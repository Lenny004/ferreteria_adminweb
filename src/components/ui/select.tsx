/**
 * Select nativo estilizado con el mismo contrato visual y de accesibilidad que Input.
 */

import * as React from "react";

import { cn } from "@/lib/utils";

/** Props del selector nativo compartido. */
export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/** Selector nativo para formularios que conserva el comportamiento del navegador. */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => {
    // Las restricciones de texto se reutilizan en selects, pero sus atributos type/inputMode no son válidos aquí.
    const selectProps = { ...props } as SelectProps & { type?: unknown; inputMode?: unknown };
    delete selectProps.type;
    delete selectProps.inputMode;

    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...selectProps}
      />
    );
  },
);
Select.displayName = "Select";

export { Select };
