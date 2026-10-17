/**
 * Reglas de presentación del catálogo de productos en el panel: permisos de edición
 * y conversión/validación del formulario de alta y edición.
 * La autorización efectiva y la validación definitiva siguen en la API.
 */

import type { WebUserRole } from "@/lib/auth";
import type { CreateProductInput, ProductRow } from "@/lib/api/products";

/** Roles que la API autoriza para `POST /products` y `PATCH /products/:id`. */
const PRODUCT_WRITE_ROLES: readonly WebUserRole[] = ["ADMIN", "OWNER"];

/**
 * Indica si el rol puede crear o editar productos.
 *
 * @param role - Rol del WebUser autenticado.
 * @returns `true` para ADMIN y OWNER; el contador solo consulta.
 */
export function canManageProducts(role: WebUserRole): boolean {
  return PRODUCT_WRITE_ROLES.includes(role);
}

/** Valores crudos del formulario (todos texto para no perder lo que escribe el usuario). */
export type ProductFormValues = {
  code: string;
  description: string;
  familyId: string;
  subfamilyId: string;
  measurementTypeId: string;
  barcode: string;
  salePrice: string;
  costPrice: string;
  minStock: string;
  notes: string;
  isActive: boolean;
};

/** Errores por campo del formulario de producto. */
export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

/** Formulario vacío para dar de alta un producto. */
export const emptyProductForm: ProductFormValues = {
  code: "",
  description: "",
  familyId: "",
  subfamilyId: "",
  measurementTypeId: "",
  barcode: "",
  salePrice: "0",
  costPrice: "0",
  minStock: "0",
  notes: "",
  isActive: true,
};

/**
 * Carga un producto existente en el formulario de edición.
 *
 * @param product - Producto devuelto por la API.
 * @returns Valores del formulario con números como texto.
 */
export function productToForm(product: ProductRow): ProductFormValues {
  return {
    code: product.code,
    description: product.description,
    familyId: product.familyId ?? product.family?.id ?? "",
    subfamilyId: product.subfamilyId ?? product.subfamily?.id ?? "",
    measurementTypeId: product.measurementTypeId ?? product.measurementType?.id ?? "",
    barcode: product.barcode ?? "",
    salePrice: String(product.salePrice ?? 0),
    costPrice: String(product.costPrice ?? 0),
    minStock: String(product.minStock ?? 0),
    notes: product.notes ?? "",
    isActive: product.isActive,
  };
}

/** Resultado de validar el formulario: datos listos para la API o errores por campo. */
export type ProductFormResult =
  | { ok: true; data: CreateProductInput }
  | { ok: false; errors: ProductFormErrors };

/** Convierte un texto numérico no negativo; `null` si no es válido. */
function parseNonNegative(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Valida el formulario y construye el cuerpo para crear o editar.
 * Los textos opcionales vacíos se envían como `null` para poder limpiarlos al editar.
 *
 * @param values - Valores capturados en el formulario.
 * @returns Datos normalizados o el mapa de errores por campo.
 */
export function buildProductPayload(values: ProductFormValues): ProductFormResult {
  const errors: ProductFormErrors = {};
  const code = values.code.trim();
  const description = values.description.trim();
  if (!code) errors.code = "Ingresa el código del producto.";
  if (!description) errors.description = "Ingresa la descripción.";
  if (!values.familyId) errors.familyId = "Selecciona una familia.";
  if (!values.measurementTypeId) errors.measurementTypeId = "Selecciona la unidad de medida.";

  const salePrice = parseNonNegative(values.salePrice);
  const costPrice = parseNonNegative(values.costPrice);
  const minStock = parseNonNegative(values.minStock);
  if (salePrice === null) errors.salePrice = "El precio de venta debe ser un número no negativo.";
  if (costPrice === null) errors.costPrice = "El costo debe ser un número no negativo.";
  if (minStock === null) errors.minStock = "El stock mínimo debe ser un número no negativo.";

  if (Object.keys(errors).length > 0 || salePrice === null || costPrice === null || minStock === null) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      code,
      description,
      familyId: values.familyId,
      subfamilyId: values.subfamilyId || null,
      measurementTypeId: values.measurementTypeId,
      barcode: values.barcode.trim() || null,
      salePrice,
      costPrice,
      minStock,
      notes: values.notes.trim() || null,
    },
  };
}
