/**
 * Mensajes de contacto — cliente HTTP hacia `/contact-messages` (público para crear, admin autenticado).
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

/** Formulario público y bandeja admin de mensajes de contacto. */
export const contactApi = {
  /** Envía un mensaje sin autenticación. */
  create: (data: CreateContactInput) =>
    apiRequest<ContactMessage>("/contact-messages", {
      method: "POST",
      token: null,
      body: JSON.stringify(data),
    }),

  /** Lista mensajes (`status`, `q`, `take`, `skip`). */
  list: (params?: ContactListParams) => {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.q) search.set("q", params.q);
    if (params?.take != null) search.set("take", String(params.take));
    if (params?.skip != null) search.set("skip", String(params.skip));
    const qs = search.toString();
    return api.get<ContactListResult>(`/contact-messages${qs ? `?${qs}` : ""}`);
  },

  /** Obtiene un mensaje por id. */
  getById: (id: string) => api.get<ContactMessage>(`/contact-messages/${id}`),

  /** Actualiza estado o notas internas del admin. */
  update: (
    id: string,
    data: { status?: ContactStatus; adminNotes?: string | null },
  ) => api.patch<ContactMessage>(`/contact-messages/${id}`, data),
};
