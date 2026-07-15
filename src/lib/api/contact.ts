/**
 * Mensajes de contacto: público (crear) y admin (listar/actualizar).
 */

import { api, apiRequest } from "@/lib/api";

export type ContactStatus = "NEW" | "READ" | "ARCHIVED";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: ContactStatus;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type CreateContactInput = {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
};

export type ContactListParams = {
  status?: ContactStatus;
  q?: string;
  take?: number;
  skip?: number;
};

export type ContactListResult = {
  items: ContactMessage[];
  total: number;
  take: number;
  skip: number;
};

export const contactApi = {
  create: (data: CreateContactInput) =>
    apiRequest<ContactMessage>("/contact-messages", {
      method: "POST",
      token: null,
      body: JSON.stringify(data),
    }),

  list: (params?: ContactListParams) => {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.q) search.set("q", params.q);
    if (params?.take != null) search.set("take", String(params.take));
    if (params?.skip != null) search.set("skip", String(params.skip));
    const qs = search.toString();
    return api.get<ContactListResult>(`/contact-messages${qs ? `?${qs}` : ""}`);
  },

  getById: (id: string) => api.get<ContactMessage>(`/contact-messages/${id}`),

  update: (
    id: string,
    data: { status?: ContactStatus; adminNotes?: string | null },
  ) => api.patch<ContactMessage>(`/contact-messages/${id}`, data),
};
