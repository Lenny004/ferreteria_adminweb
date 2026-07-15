import { api } from "@/lib/api";

export type CustomerRow = {
  id: string;
  name: string;
  customerType: string;
  dui?: string | null;
  nit?: string | null;
  nrc?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  municipality?: string | null;
  department?: string | null;
  isActive: boolean;
};

export type CreateCustomerInput = {
  name: string;
  customerType?: string;
  dui?: string | null;
  nit?: string | null;
  nrc?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  municipality?: string | null;
  department?: string | null;
};

export const customersApi = {
  list: (params?: { q?: string; take?: number }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.take) search.set("take", String(params.take));
    const qs = search.toString();
    return api.get<{ items: CustomerRow[]; total: number }>(
      `/customers${qs ? `?${qs}` : ""}`,
    );
  },
  create: (data: CreateCustomerInput) => api.post<CustomerRow>("/customers", data),
  update: (id: string, data: Partial<CreateCustomerInput> & { isActive?: boolean }) =>
    api.patch<CustomerRow>(`/customers/${id}`, data),
};
