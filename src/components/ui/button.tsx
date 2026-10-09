/**
 * Botón del design system AdminWeb (variantes CVA + Radix Slot).
 */

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Variantes semánticas del botón compartido. */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "default"
  | "danger";

/** Tamaños disponibles para botones y acciones solo-icono. */
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "default";

/** Clases CVA del botón para composiciones que necesiten extenderlas. */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        outline:
          "border border-border bg-card text-foreground shadow-sm hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:opacity-90",
        destructive:
          "bg-danger text-[var(--color-primary-contrast)] shadow-sm hover:bg-danger/90",
        danger:
          "bg-danger text-[var(--color-primary-contrast)] shadow-sm hover:bg-danger/90",
      },
      size: {
        md: "h-10 px-4 py-2",
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

/** Props públicas del botón compartido. */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "variant" | "size"> {
  /** Variante semántica; `default` y `danger` son alias heredados. */
  variant?: ButtonVariant;
  /** Tamaño; `default` es alias heredado de `md`. */
  size?: ButtonSize;
  asChild?: boolean;
  /** Deshabilita el control para evitar envíos duplicados. */
  loading?: boolean;
  /** Texto visible durante la carga. */
  loadingText?: string;
}

/** Botón de acción con aliases heredados y protección contra doble envío. */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText = "Cargando…",
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const content = asChild || !loading ? (
      children
    ) : (
      <>
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
        <span>{loadingText}</span>
      </>
    );

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        {...(asChild ? {} : { disabled: disabled || loading })}
        aria-busy={loading || undefined}
        aria-disabled={asChild ? (loading || disabled ? true : undefined) : undefined}
      >
        {content}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
