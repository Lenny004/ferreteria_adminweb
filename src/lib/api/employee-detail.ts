/**
 * Detalle de empleado (cuentas bancarias y documentos) — cliente HTTP hacia `/employees/:id/...`.
 */

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

/** Ficha extendida: datos básicos, cuentas bancarias y expediente documental. */
export const employeeDetailApi = {
  /** Obtiene el empleado por id. */
  getById: (id: string) => api.get<EmployeeRow>(`/employees/${id}`),
  /** Lista cuentas bancarias del empleado. */
  listBankAccounts: (employeeId: string) =>
    api.get<EmployeeBankAccountRow[]>(`/employees/${employeeId}/bank-accounts`),
  /** Registra una cuenta bancaria. */
  createBankAccount: (
    employeeId: string,
    data: {
      bankId: string;
      accountType?: string;
      accountNumber: string;
      isPrimary?: boolean;
    },
  ) => api.post<EmployeeBankAccountRow>(`/employees/${employeeId}/bank-accounts`, data),
  /** Actualiza una cuenta bancaria. */
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
  /** Lista documentos del expediente. */
  listDocuments: (employeeId: string) =>
    api.get<EmployeeDocumentRow[]>(`/employees/${employeeId}/documents`),
  /** Registra un documento en el expediente. */
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
  /** Actualiza un documento del expediente. */
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
