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
  /** Coloca el indicador visual de obligatoriedad dentro del label accesible. */
  requiredIndicatorInsideLabel?: boolean;
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
  requiredIndicatorInsideLabel = true,
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
  const isRequired = required || Boolean(child.props.required) || Boolean(constraints?.required);
  const requiredId = isRequired ? `${controlId}-required` : undefined;
  const describedBy = [child.props["aria-describedby"], placeholderId, helpId, errorId, requiredId]
    .filter(Boolean)
    .join(" ");

  const control = React.cloneElement(child, {
    id: controlId,
    name: name ?? child.props.name,
    placeholder: effectivePlaceholder,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": error ? true : child.props["aria-invalid"] || undefined,
    ...(constraints ?? {}),
    required: isRequired,
    "aria-required": isRequired || child.props["aria-required"] || undefined,
  });

  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center gap-1">
        <label htmlFor={controlId} className="text-sm font-medium text-foreground">
          <span>{label}</span>
          {isRequired && requiredIndicatorInsideLabel ? (
            <span aria-hidden="true"> *</span>
          ) : null}
        </label>
        {isRequired && !requiredIndicatorInsideLabel ? (
          <span aria-hidden="true" className="text-sm font-medium text-foreground">
            *
          </span>
        ) : null}
      </div>
      {control}
      {isRequired ? (
        <span id={requiredId} className="sr-only">
          {validationMessages.required}
        </span>
      ) : null}
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
