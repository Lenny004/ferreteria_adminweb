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

export const suppliersApi = {
  list: (params?: { q?: string; take?: number; skip?: number }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.take != null) search.set("take", String(params.take));
    if (params?.skip != null) search.set("skip", String(params.skip));
    const qs = search.toString();
    return api.get<{ items: SupplierRow[]; total: number; take: number; skip: number }>(
      `/suppliers${qs ? `?${qs}` : ""}`,
    );
  },
  getById: (id: string) => api.get<SupplierRow>(`/suppliers/${id}`),
  create: (data: CreateSupplierInput) => api.post<SupplierRow>("/suppliers", data),
  update: (id: string, data: Partial<CreateSupplierInput> & { isActive?: boolean }) =>
    api.patch<SupplierRow>(`/suppliers/${id}`, data),
};
