import { api } from "@/lib/api";

export const TERMINATION_REASONS = [
  "RENUNCIA_VOLUNTARIA",
  "DESPIDO_JUSTIFICADO",
  "DESPIDO_INJUSTIFICADO",
  "MUTUO_ACUERDO",
  "VENCIMIENTO_CONTRATO",
  "FALLECIMIENTO",
  "JUBILACION",
] as const;

export type TerminationReason = (typeof TERMINATION_REASONS)[number];
export type TerminationStatus = "EN_REVISION" | "APROBADA" | "PAGADA" | "ANULADA";

export type TerminationRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  terminationDate: string;
  reason: TerminationReason;
  status: TerminationStatus;
  yearsOfService: number | null;
  indemnizacionDays: number | null;
  indemnizacionAmount: number | null;
  vacationDaysPending: number | null;
  vacationPayAmount: number | null;
  aguinaldoProportional: number | null;
  pendingSalary: number | null;
  totalSettlement: number | null;
  settlementNotes?: string | null;
  voidReason?: string | null;
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
};

export const terminationsApi = {
  list: (params?: { take?: number; skip?: number }) => {
    const search = new URLSearchParams();
    if (params?.take != null) search.set("take", String(params.take));
    if (params?.skip != null) search.set("skip", String(params.skip));
    const qs = search.toString();
    return api.get<{
      items: TerminationRow[];
      total: number;
      take: number;
      skip: number;
    }>(`/employee-terminations${qs ? `?${qs}` : ""}`);
  },
  getById: (id: string) => api.get<TerminationRow>(`/employee-terminations/${id}`),
  create: (data: CreateTerminationInput) =>
    api.post<TerminationRow>("/employee-terminations", data),
  approve: (id: string) => api.post<TerminationRow>(`/employee-terminations/${id}/approve`),
  pay: (id: string) => api.post<TerminationRow>(`/employee-terminations/${id}/pay`),
  void: (id: string, reason: string) =>
    api.post<TerminationRow>(`/employee-terminations/${id}/void`, { reason }),
};
