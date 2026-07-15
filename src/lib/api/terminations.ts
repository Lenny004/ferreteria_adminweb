import { api } from "@/lib/api";

export type TerminationReason =
  | "RENUNCIA_VOLUNTARIA"
  | "DESPIDO_JUSTIFICADO"
  | "DESPIDO_INJUSTIFICADO"
  | "MUTUO_ACUERDO"
  | "VENCIMIENTO_CONTRATO"
  | "FALLECIMIENTO"
  | "JUBILACION";

export type TerminationStatus = "EN_REVISION" | "APROBADA" | "PAGADA" | "ANULADA";

export type EmployeeTerminationRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  terminationDate: string;
  reason: TerminationReason;
  status: TerminationStatus;
  yearsOfService: string | number | null;
  indemnizacionDays: string | number | null;
  indemnizacionAmount: string | number | null;
  vacationDaysPending: string | number | null;
  vacationPayAmount: string | number | null;
  aguinaldoProportional: string | number | null;
  pendingSalary: string | number | null;
  totalSettlement: string | number | null;
  settlementNotes?: string | null;
  documentUrl?: string | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  createdBy?: string | null;
  approvedBy?: string | null;
  paidAt?: string | null;
  createdAt: string;
};

export type CreateTerminationInput = {
  employeeId: string;
  terminationDate: string;
  reason: TerminationReason;
  pendingSalary?: number;
  settlementNotes?: string;
  documentUrl?: string;
};

export const terminationsApi = {
  list: () => api.get<EmployeeTerminationRow[]>("/employee-terminations"),
  getById: (id: string) => api.get<EmployeeTerminationRow>(`/employee-terminations/${id}`),
  create: (data: CreateTerminationInput) => api.post<EmployeeTerminationRow>("/employee-terminations", data),
  approve: (id: string) => api.post<EmployeeTerminationRow>(`/employee-terminations/${id}/approve`),
  pay: (id: string) => api.post<EmployeeTerminationRow>(`/employee-terminations/${id}/pay`),
  void: (id: string, reason: string) =>
    api.post<EmployeeTerminationRow>(`/employee-terminations/${id}/void`, { reason }),
};
