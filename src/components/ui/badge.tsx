/**
 * Insignia del design system AdminWeb para estados cortos.
 */

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-primary/12 text-primary",
        success: "bg-success/12 text-success",
        warning: "bg-warning/15 text-warning",
        muted: "bg-muted text-muted-foreground",
        danger: "bg-danger/12 text-danger",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <span className={cn(badgeVariants({ variant, className }))} ref={ref} {...props} />;
  },
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
