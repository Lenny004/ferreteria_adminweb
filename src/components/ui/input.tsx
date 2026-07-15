/**
 * Input de texto del design system AdminWeb (clases base + className).
 * Envoltorio mínimo sobre `<input>`; sin acoplamiento a entidades del ERP.
 */

import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Input reutilizable con estilos base consistentes; acepta `className` para ajustes.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn("h-10 w-full rounded-md border border-border px-3 text-sm", className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
