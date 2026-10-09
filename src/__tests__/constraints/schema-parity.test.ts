/** Verifica que los mapas de formularios y la copia versionada coincidan semánticamente con el contrato generado por el backend. */

import fs from "node:fs";
import path from "node:path";

import generated from "@/lib/constraints/generated/constraints.json";
import { CONSTRAINT_MAPS } from "@/lib/constraints";
import { ProductConstraints } from "@/lib/constraints/product";
import type { FieldConstraint } from "@/lib/constraints/types";

type ProductConstraintKey = keyof typeof ProductConstraints;
const validProductConstraintKey: ProductConstraintKey = "code";
void validProductConstraintKey;

// @ts-expect-error Una clave inexistente no debe estar disponible en el mapa tipado.
const invalidProductConstraintKey: ProductConstraintKey = "cod";
void invalidProductConstraintKey;

type GeneratedField = {
  type: string;
  maxLength?: number;
  step?: number;
  max?: number;
  required?: boolean;
};

describe("paridad de restricciones", () => {
  it("mantiene maxLength, step, max y required del JSON generado", () => {
    for (const [modelName, constraintMap] of Object.entries(CONSTRAINT_MAPS)) {
      const fields = (generated.models as Record<string, { fields: Record<string, GeneratedField> }>)[modelName].fields;
      for (const [fieldName, constraint] of Object.entries(constraintMap as Record<string, FieldConstraint>)) {
        const source = fields[fieldName];
        expect(source).toBeDefined();
        expect(constraint.maxLength).toBe(source.maxLength);
        expect(constraint.step).toBe(source.type === "Int" ? 1 : source.step);
        expect(constraint.max).toBe(source.max);
        expect(constraint.required).toBe(source.required);
      }
    }
  });

  it("incluye cada VarChar y Decimal de los modelos con formularios", () => {
    for (const [modelName, constraintMap] of Object.entries(CONSTRAINT_MAPS)) {
      const fields = (generated.models as Record<string, { fields: Record<string, GeneratedField> }>)[modelName].fields;
      for (const [fieldName, source] of Object.entries(fields)) {
        if (source.maxLength === undefined && source.type !== "Decimal") continue;
        expect((constraintMap as Record<string, FieldConstraint>)[fieldName]).toBeDefined();
      }
    }
  });

  const externalPath = process.env.CONSTRAINTS_JSON_PATH;
  const isCi = process.env.CI !== undefined;
  const externalFileExists = externalPath !== undefined && fs.existsSync(externalPath);

  if (isCi && externalPath === undefined) {
    it("requiere CONSTRAINTS_JSON_PATH en CI", () => {
      throw new Error("En CI, CONSTRAINTS_JSON_PATH debe estar definido para comprobar la paridad con el backend.");
    });
  } else if (isCi && !externalFileExists) {
    it("requiere un JSON del backend existente en CI", () => {
      throw new Error(`En CI, CONSTRAINTS_JSON_PATH debe apuntar a un archivo existente: ${externalPath}`);
    });
  } else {
    // Fuera de CI la comparación externa se omite cuando no se proporciona el contrato del backend.
    (externalPath ? it : it.skip)("coincide por contenido con el JSON generado por el backend", () => {
      const versionedPath = path.resolve(__dirname, "../../lib/constraints/generated/constraints.json");
      expect(JSON.parse(fs.readFileSync(versionedPath, "utf8"))).toEqual(
        JSON.parse(fs.readFileSync(path.resolve(externalPath!), "utf8")),
      );
    });
  }
});
