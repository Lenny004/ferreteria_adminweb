/**
 * Proveedores — cliente HTTP hacia `/suppliers`.
 */

import { api } from "@/lib/api";

export type SupplierRow = {
  id: string;
  name: string;
  tradeName?: string | null;
  nit?: string | null;
  nrc?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  municipality?: string | null;
  department?: string | null;
  country: string;
  creditDays: number;
  isActive: boolean;
  notes?: string | null;
  createdAt?: string;
};

export type CreateSupplierInput = {
  name: string;
  tradeName?: string | null;
  nit?: string | null;
  nrc?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  municipality?: string | null;
  department?: string | null;
  country?: string;
  creditDays?: number;
  notes?: string | null;
};

/** CRUD y listado paginado de proveedores. */
export const suppliersApi = {
  /** Lista proveedores (`q`, `activeOnly`, `country`, `withCredit`, `take`, `skip`). */
  list: (params?: {
    q?: string;
    take?: number;
    skip?: number;
    activeOnly?: boolean;
    country?: string;
    withCredit?: boolean;
  }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.take != null) search.set("take", String(params.take));
    if (params?.skip != null) search.set("skip", String(params.skip));
    if (params?.activeOnly !== undefined) search.set("activeOnly", String(params.activeOnly));
    if (params?.country) search.set("country", params.country);
    if (params?.withCredit !== undefined) search.set("withCredit", String(params.withCredit));
    const qs = search.toString();
    return api.get<{ items: SupplierRow[]; total: number; take: number; skip: number }>(
      `/suppliers${qs ? `?${qs}` : ""}`,
    );
  },
  /** Obtiene un proveedor por id. */
  getById: (id: string) => api.get<SupplierRow>(`/suppliers/${id}`),
  /** Crea un proveedor. */
  create: (data: CreateSupplierInput) => api.post<SupplierRow>("/suppliers", data),
  /** Actualiza un proveedor por id. */
  update: (id: string, data: Partial<CreateSupplierInput> & { isActive?: boolean }) =>
    api.patch<SupplierRow>(`/suppliers/${id}`, data),
};
