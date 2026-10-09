"use client";

/**
 * Campo de formulario accesible: asocia etiqueta, ayuda, error y restricciones al control hijo.
 */

import { useId, type ReactElement, type ReactNode } from "react";
import * as React from "react";

import type { FieldConstraint } from "@/lib/constraints/types";
import { validationMessages } from "@/lib/validation-messages";
import { cn } from "@/lib/utils";

type FormControlProps = React.HTMLAttributes<HTMLElement> & Record<string, unknown>;

/** Props del campo compartido para Input, Select, Textarea y controles compatibles. */
export type FormFieldProps = {
  label: string;
  required?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
  help?: ReactNode;
  error?: string;
  constraints?: FieldConstraint;
  children: ReactElement;
  className?: string;
};

/**
 * Renderiza un campo con nombre accesible, estado inválido y restricciones centralizadas.
 *
 * @param props - Etiqueta, control hijo, ayuda, error y restricciones del campo.
 * @returns Un contenedor con etiqueta y control asociado.
 */
export function FormField({
  label,
  required = false,
  id,
  name,
  placeholder,
  help,
  error,
  constraints,
  children,
  className,
}: FormFieldProps) {
  const child = children as ReactElement<FormControlProps>;
  const generatedId = useId().replace(/:/g, "");
  const controlId = id ?? child.props.id ?? `field-${generatedId}`;
  const effectivePlaceholder = (placeholder ?? child.props.placeholder) as string | undefined;
  const placeholderId = effectivePlaceholder ? `${controlId}-placeholder` : undefined;
  const helpId = help ? `${controlId}-help` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [child.props["aria-describedby"], placeholderId, helpId, errorId]
    .filter(Boolean)
    .join(" ");
  const effectiveRequired = required || Boolean(child.props.required);

  const control = React.cloneElement(child, {
    ...(constraints ?? {}),
    id: controlId,
    name: name ?? child.props.name,
    required: effectiveRequired,
    "aria-required": effectiveRequired || child.props["aria-required"] || undefined,
    placeholder: effectivePlaceholder,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": error ? true : child.props["aria-invalid"] || undefined,
  });

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={controlId} className="text-sm font-medium text-foreground">
        <span>{label}</span>
        {effectiveRequired ? (
          <>
            <span aria-hidden="true"> *</span>
            <span className="sr-only">{validationMessages.required}</span>
          </>
        ) : null}
      </label>
      {control}
      {effectivePlaceholder ? (
        <span id={placeholderId} className="sr-only">
          Ejemplo: {effectivePlaceholder}
        </span>
      ) : null}
      {help ? (
        <p id={helpId} className="text-xs text-muted-foreground">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
