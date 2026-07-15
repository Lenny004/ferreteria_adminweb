/**
 * Insignia del design system AdminWeb (variantes CVA) para estados cortos
 * (Activo/Inactivo, Pagado/Pendiente, etc.). Sin acoplamiento a entidades del ERP.
 */

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Variantes visuales de la insignia. */
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        muted: "bg-muted text-muted-foreground",
        danger: "bg-primary/15 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/** Props de la insignia. */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Insignia reutilizable para mostrar estados cortos en listados y tablas.
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <span className={cn(badgeVariants({ variant, className }))} ref={ref} {...props} />;
  },
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
