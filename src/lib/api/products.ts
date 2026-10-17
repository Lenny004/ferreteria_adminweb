/**
 * Productos — cliente HTTP hacia `/products`.
 */

import { api } from "@/lib/api";

export type ProductRow = {
  id: string;
  code: string;
  description: string;
  salePrice: string | number;
  costPrice: string | number;
  currentStock: string | number;
  minStock: string | number;
  isActive: boolean;
  barcode?: string | null;
  notes?: string | null;
  familyId?: string;
  subfamilyId?: string | null;
  measurementTypeId?: string;
  family?: { id: string; code: string; name: string } | null;
  subfamily?: { id: string; name: string } | null;
  measurementType?: { id: string; code: string; name: string; unitLabel?: string } | null;
};

/** Subfamilia activa ofrecida en el formulario de producto. */
export type ProductSubfamilyOption = { id: string; code: string; name: string };

/** Familia activa con sus subfamilias, para el selector en cascada del formulario. */
export type ProductFamilyOption = {
  id: string;
  code: string;
  name: string;
  subfamilies: ProductSubfamilyOption[];
};

/** Unidad de medida del catálogo (`decimals` indica cuántos decimales admite la cantidad). */
export type MeasurementTypeOption = {
  id: string;
  code: string;
  name: string;
  unitLabel: string;
  decimals: number;
};

/** Catálogos que necesita el alta/edición de productos (`GET /products/options`). */
export type ProductFormOptions = {
  families: ProductFamilyOption[];
  measurementTypes: MeasurementTypeOption[];
};

/**
 * Datos de alta de producto. El stock inicial no se envía: el stock se mueve
 * solo con movimientos de inventario para que el kardex quede completo.
 */
export type CreateProductInput = {
  code: string;
  description: string;
  familyId: string;
  measurementTypeId: string;
  subfamilyId?: string | null;
  barcode?: string | null;
  salePrice?: number;
  costPrice?: number;
  minStock?: number;
  notes?: string | null;
};

/** Datos de edición parcial; `isActive` permite desactivar o reactivar. */
export type UpdateProductInput = Partial<CreateProductInput> & { isActive?: boolean };

/** Consulta y mantenimiento del catálogo de productos. */
export const productsApi = {
  /** Lista productos (`q`, `familyId`, `inStock`, `includeInactive`, `take`, `skip`). */
  list: (params?: {
    q?: string;
    familyId?: string;
    inStock?: boolean;
    includeInactive?: boolean;
    take?: number;
    skip?: number;
  }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.familyId) search.set("familyId", params.familyId);
    if (params?.inStock === true) search.set("inStock", "true");
    if (params?.includeInactive === true) search.set("includeInactive", "true");
    if (params?.take) search.set("take", String(params.take));
    if (params?.skip != null) search.set("skip", String(params.skip));
    const qs = search.toString();
    return api.get<{ items: ProductRow[]; total: number }>(
      `/products${qs ? `?${qs}` : ""}`,
    );
  },
  /** Obtiene un producto por id. */
  getById: (id: string) => api.get<ProductRow>(`/products/${encodeURIComponent(id)}`),
  /** Familias, subfamilias y unidades de medida para el formulario. */
  options: () => api.get<ProductFormOptions>("/products/options"),
  /** Crea un producto (ADMIN u OWNER). */
  create: (data: CreateProductInput) => api.post<ProductRow>("/products", data),
  /** Edita un producto (ADMIN u OWNER). */
  update: (id: string, data: UpdateProductInput) =>
    api.patch<ProductRow>(`/products/${encodeURIComponent(id)}`, data),
};
