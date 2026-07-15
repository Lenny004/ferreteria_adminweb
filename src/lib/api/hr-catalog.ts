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

export const hrCatalogApi = {
  listBanks: () => api.get<BankRow[]>("/banks"),
  createBank: (data: { name: string; code?: string | null; swift?: string | null }) =>
    api.post<BankRow>("/banks", data),
  updateBank: (
    id: string,
    data: Partial<{ name: string; code: string | null; swift: string | null; isActive: boolean }>,
  ) => api.patch<BankRow>(`/banks/${id}`, data),

  listDocumentTypes: () => api.get<DocumentTypeRow[]>("/document-types"),
  createDocumentType: (data: {
    name: string;
    description?: string | null;
    isMandatory?: boolean;
    hasExpiry?: boolean;
  }) => api.post<DocumentTypeRow>("/document-types", data),
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

  listHolidays: (year?: number) => {
    const qs = year ? `?year=${year}` : "";
    return api.get<HolidayRow[]>(`/holidays${qs}`);
  },
  createHoliday: (data: {
    name: string;
    date: string;
    year: number;
    isMandatory?: boolean;
  }) => api.post<HolidayRow>("/holidays", data),
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
