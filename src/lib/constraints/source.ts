/**
 * Deriva restricciones de formularios desde el contrato generado del backend.
 * `generated/constraints.json` es una copia versionada de
 * `ferreteria_api/generated/constraints.json` (origen Prisma, commit
 * `4f72f62`). Para actualizarla se regenera el contrato en el backend y se
 * copia el archivo generado a esta ruta; nunca se edita manualmente.
 */

import generated from "@/lib/constraints/generated/constraints.json";
import type { FieldConstraint } from "@/lib/constraints/types";

type GeneratedField = {
  type: string;
  maxLength?: number;
  step?: number;
  max?: number;
  required?: boolean;
};

type GeneratedModel = {
  fields: Record<string, GeneratedField>;
};

type GeneratedModels = typeof generated.models;
type ScalarGeneratedType = "String" | "Decimal" | "Int" | "DateTime" | "Boolean";

/** Nombre de un modelo presente en el contrato versionado. */
export type ConstraintModel = keyof GeneratedModels;

type GeneratedModelFields<M extends ConstraintModel> = GeneratedModels[M]["fields"];

type ScalarFieldName<M extends ConstraintModel> = Extract<
  {
    [K in keyof GeneratedModelFields<M>]:
      GeneratedModelFields<M>[K] extends { type: infer FieldType }
        ? FieldType extends ScalarGeneratedType
          ? K
          : never
        : never;
  }[keyof GeneratedModelFields<M>] extends infer ScalarKeys
    ? [ScalarKeys] extends [never]
      ? keyof GeneratedModelFields<M>
      : ScalarKeys
    : never,
  keyof GeneratedModelFields<M>
>;

/** Mapa tipado con las restricciones de los campos escalares de un modelo. */
export type ModelConstraints<M extends ConstraintModel> = {
  readonly [K in ScalarFieldName<M>]: FieldConstraint;
};

/** Ajustes semánticos que no se pueden inferir solo del tipo de base de datos. */
export type ConstraintSemantics = Pick<FieldConstraint, "type" | "inputMode">;

const SCALAR_TYPES = new Set(["String", "Decimal", "Int", "DateTime", "Boolean"]);

function defaultSemantics(fieldName: string, field: GeneratedField): ConstraintSemantics {
  if (field.type === "Decimal") return { type: "number", inputMode: "decimal" };
  if (field.type === "Int") return { type: "number", inputMode: "numeric" };
  if (field.type === "DateTime") return { type: "date" };
  if (field.type !== "String") return {};

  const normalizedName = fieldName.toLowerCase();
  if (normalizedName.includes("email")) return { type: "email", inputMode: "email" };
  if (normalizedName.includes("phone") || normalizedName.includes("tel")) {
    return { type: "tel", inputMode: "tel" };
  }
  if (normalizedName.includes("password") || normalizedName.includes("pinhash")) {
    return { type: "password", inputMode: "text" };
  }
  return { type: "text", inputMode: "text" };
}

function deriveFieldConstraint(fieldName: string, field: GeneratedField, semantics?: ConstraintSemantics): FieldConstraint {
  const constraint: FieldConstraint = {
    required: field.required,
    ...defaultSemantics(fieldName, field),
    ...semantics,
  };

  if (field.maxLength !== undefined) constraint.maxLength = field.maxLength;
  if (field.type === "Decimal") {
    constraint.min = 0;
    constraint.step = field.step;
    constraint.max = field.max;
  }
  if (field.type === "Int") constraint.step = 1;

  return constraint;
}

/**
 * Construye el mapa de una entidad usando únicamente los metadatos generados.
 * Incluye todos sus campos escalares para que el test de paridad detecte
 * cualquier restricción VarChar o Decimal que falte.
 *
 * @param model - Modelo cuya metadata se debe proyectar al formulario.
 * @param semantics - Ajustes semánticos opcionales por nombre de campo.
 * @returns Mapa de restricciones HTML por campo.
 */
export function deriveModelConstraints<M extends ConstraintModel>(
  model: M,
  semantics: Record<string, ConstraintSemantics> = {},
): ModelConstraints<M> {
  const modelDefinition = (generated.models as Record<string, GeneratedModel>)[model];
  return Object.fromEntries(
    Object.entries(modelDefinition.fields)
      .filter(([, field]) => SCALAR_TYPES.has(field.type))
      .map(([fieldName, field]) => [fieldName, deriveFieldConstraint(fieldName, field, semantics[fieldName])]),
  ) as ModelConstraints<M>;
}
