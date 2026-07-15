import { api } from "@/lib/api";
import type { EmployeeRow } from "./employees";

export type EmployeeBankAccountRow = {
  id: string;
  employeeId: string;
  bankId: string;
  accountType: string;
  accountNumber: string;
  isPrimary: boolean;
  isActive: boolean;
  bank?: { id: string; name: string; code?: string | null } | null;
};

export type EmployeeDocumentRow = {
  id: string;
  employeeId: string;
  docTypeId: string;
  status: string;
  fileUrl?: string | null;
  fileName?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
  docType?: { id: string; name: string } | null;
};

export const employeeDetailApi = {
  getById: (id: string) => api.get<EmployeeRow>(`/employees/${id}`),
  listBankAccounts: (employeeId: string) =>
    api.get<EmployeeBankAccountRow[]>(`/employees/${employeeId}/bank-accounts`),
  createBankAccount: (
    employeeId: string,
    data: {
      bankId: string;
      accountType?: string;
      accountNumber: string;
      isPrimary?: boolean;
    },
  ) => api.post<EmployeeBankAccountRow>(`/employees/${employeeId}/bank-accounts`, data),
  updateBankAccount: (
    employeeId: string,
    id: string,
    data: Partial<{
      bankId: string;
      accountType: string;
      accountNumber: string;
      isPrimary: boolean;
      isActive: boolean;
    }>,
  ) => api.patch<EmployeeBankAccountRow>(`/employees/${employeeId}/bank-accounts/${id}`, data),
  listDocuments: (employeeId: string) =>
    api.get<EmployeeDocumentRow[]>(`/employees/${employeeId}/documents`),
  createDocument: (
    employeeId: string,
    data: {
      docTypeId: string;
      status?: string;
      fileUrl?: string | null;
      fileName?: string | null;
      issueDate?: string | null;
      expiryDate?: string | null;
      notes?: string | null;
    },
  ) => api.post<EmployeeDocumentRow>(`/employees/${employeeId}/documents`, data),
  updateDocument: (
    employeeId: string,
    id: string,
    data: Partial<{
      docTypeId: string;
      status: string;
      fileUrl: string | null;
      fileName: string | null;
      issueDate: string | null;
      expiryDate: string | null;
      notes: string | null;
      isActive: boolean;
    }>,
  ) => api.patch<EmployeeDocumentRow>(`/employees/${employeeId}/documents/${id}`, data),
};
