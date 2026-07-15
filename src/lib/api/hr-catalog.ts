/**
 * Catálogos RRHH (bancos, tipos de documento, feriados) — cliente HTTP hacia `/banks`, `/document-types`, `/holidays`.
 */

import { api } from "@/lib/api";

export type BankRow = {
  id: string;
  name: string;
  code?: string | null;
  swift?: string | null;
  isActive: boolean;
};

export type DocumentTypeRow = {
  id: string;
  name: string;
  description?: string | null;
  isMandatory: boolean;
  appliesToContractType?: string | null;
  hasExpiry: boolean;
  isActive: boolean;
};

export type HolidayRow = {
  id: string;
  name: string;
  date: string;
  year: number;
  isMandatory: boolean;
  isActive: boolean;
};

/** Mantenimiento de catálogos de recursos humanos. */
export const hrCatalogApi = {
  /** Lista bancos activos e inactivos. */
  listBanks: () => api.get<BankRow[]>("/banks"),
  /** Crea un banco. */
  createBank: (data: { name: string; code?: string | null; swift?: string | null }) =>
    api.post<BankRow>("/banks", data),
  /** Actualiza un banco por id. */
  updateBank: (
    id: string,
    data: Partial<{ name: string; code: string | null; swift: string | null; isActive: boolean }>,
  ) => api.patch<BankRow>(`/banks/${id}`, data),

  /** Lista tipos de documento de expediente. */
  listDocumentTypes: () => api.get<DocumentTypeRow[]>("/document-types"),
  /** Crea un tipo de documento. */
  createDocumentType: (data: {
    name: string;
    description?: string | null;
    isMandatory?: boolean;
    hasExpiry?: boolean;
  }) => api.post<DocumentTypeRow>("/document-types", data),
  /** Actualiza un tipo de documento por id. */
  updateDocumentType: (
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      isMandatory: boolean;
      hasExpiry: boolean;
      isActive: boolean;
    }>,
  ) => api.patch<DocumentTypeRow>(`/document-types/${id}`, data),

  /** Lista feriados; opcionalmente filtrados por `year`. */
  listHolidays: (year?: number) => {
    const qs = year ? `?year=${year}` : "";
    return api.get<HolidayRow[]>(`/holidays${qs}`);
  },
  /** Crea un feriado. */
  createHoliday: (data: {
    name: string;
    date: string;
    year: number;
    isMandatory?: boolean;
  }) => api.post<HolidayRow>("/holidays", data),
  /** Actualiza un feriado por id. */
  updateHoliday: (
    id: string,
    data: Partial<{
      name: string;
      date: string;
      year: number;
      isMandatory: boolean;
      isActive: boolean;
    }>,
  ) => api.patch<HolidayRow>(`/holidays/${id}`, data),
};
