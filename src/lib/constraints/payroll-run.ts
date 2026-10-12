import { deriveModelConstraints } from "@/lib/constraints/source";

/** Restricciones derivadas para corridas de planilla. */
export const PayrollRunConstraints = deriveModelConstraints("PayrollRun");

/** Restricciones derivadas para detalles de corridas de planilla. */
export const PayrollDetailConstraints = deriveModelConstraints("PayrollDetail");
