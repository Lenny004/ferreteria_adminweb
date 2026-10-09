/**
 * Restricciones HTML que un formulario puede distribuir a sus controles.
 */

import type * as React from "react";

/** Contrato común para límites y formato de un campo de entrada. */
export type FieldConstraint = {
  /** Indica si el backend considera el campo obligatorio. */
  required?: boolean;
  /** Longitud mínima exigida por una regla de validación de entrada. */
  minLength?: number;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};
