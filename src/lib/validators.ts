/**
 * Esquemas Zod compartidos para parámetros de rutas y listados.
 * Evita validaciones ad hoc en páginas de Employee, Payroll, Order, etc.
 */

import { z } from "zod";

/** Valida el `id` de ruta dinámica (Employee, Order, Payroll run, etc.). */
export const idParamSchema = z.object({
  id: z.string().min(1),
});

/**
 * Paginación de listados administrativos.
 * `pageSize` se limita a 100 para no sobrecargar la API.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
