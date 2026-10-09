import { deriveModelConstraints } from "@/lib/constraints/source";

/** Restricciones derivadas para configuración del sistema. */
export const SettingConstraints = deriveModelConstraints("Setting");

/** Restricciones derivadas para configuración fiscal. */
export const DteConfigConstraints = deriveModelConstraints("DteConfig");
