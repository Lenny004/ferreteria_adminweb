/**
 * Textarea nativo estilizado con el mismo contrato visual y de accesibilidad que Input.
 */

import * as React from "react";

import { cn } from "@/lib/utils";

/** Props del área de texto compartida. */
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Área de texto nativa para formularios administrativos. */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
