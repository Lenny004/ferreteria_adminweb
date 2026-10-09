import { deriveModelConstraints } from "@/lib/constraints/source";

/** Restricciones derivadas para formularios de empleados. */
export const EmployeeConstraints = deriveModelConstraints("Employee");

/** Reglas adicionales de Zod para el PIN opcional de caja. */
export const EmployeePinConstraints = { minLength: 4, maxLength: 12, type: "password" as const };
