/**
 * Restricciones HTML que un formulario puede distribuir a sus controles.
 */

import type * as React from "react";

/** Contrato común para límites y formato de un campo de entrada. */
export type FieldConstraint = {
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};
