/**
 * Mensajes funcionales y consistentes para validación de formularios.
 */

/** Mensajes base del estándar de UI, listos para interpolar límites. */
export const validationMessages = {
  required: "Campo obligatorio",
  minLength: (value: number) => `Mínimo ${value} caracteres`,
  maxLength: (value: number) => `Máximo ${value} caracteres`,
  min: (value: number | string) => `Debe ser mayor o igual a ${value}`,
  max: (value: number | string) => `Debe ser menor o igual a ${value}`,
  decimals: (value: number) => `Máximo ${value} decimales`,
  email: "Ingrese un correo válido",
  number: "Ingrese un número válido",
  option: "Seleccione una opción",
  invalid: "El formato no es válido",
  save: "No se pudo guardar. Revise los campos marcados.",
} as const;

/** Alias en mayúsculas para consumidores que prefieren constantes de catálogo. */
export const VALIDATION_MESSAGES = validationMessages;
