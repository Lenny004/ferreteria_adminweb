import { deriveModelConstraints } from "@/lib/constraints/source";

/** Restricciones del token opaco usado para recuperar credenciales. */
export const PasswordResetTokenConstraints = deriveModelConstraints("PasswordResetToken");
