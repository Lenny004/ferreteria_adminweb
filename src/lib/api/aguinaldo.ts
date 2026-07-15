import { api } from "@/lib/api";

export type AguinaldoRunStatus = "EN_REVISION" | "APROBADA" | "PAGADA" | "ANULADA";

export type AguinaldoRunRow = {
  id: string;
  year: number;
  paymentDate: string;
  status: AguinaldoRunStatus;
  totalAmount: string | number;
  totalGross: string | number;
  totalIsr: string | number;
  createdBy?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  detailsCount: number;
};

export type AguinaldoDetailRow = {
  id: string;
  aguinaldoRunId: string;
  employeeId: string;
  employeeName: string;
  hireDate: string | null;
  yearsOfService: string | number;
  daysEntitled: string | number;
  dailySalary: string | number;
  grossAmount: string | number;
  isrRetained: string | number;
  netAmount: string | number;
  notes?: string | null;
};

export type AguinaldoRunDetailResponse = AguinaldoRunRow & { details: AguinaldoDetailRow[] };

export type GenerateAguinaldoInput = {
  year: number;
  paymentDate: string;
  notes?: string;
};

export const aguinaldoApi = {
  list: () => api.get<AguinaldoRunRow[]>("/aguinaldo"),
  getById: (id: string) => api.get<AguinaldoRunDetailResponse>(`/aguinaldo/${id}`),
  generate: (data: GenerateAguinaldoInput) => api.post<AguinaldoRunRow>("/aguinaldo", data),
  approve: (id: string) => api.post<AguinaldoRunRow>(`/aguinaldo/${id}/approve`),
  pay: (id: string) => api.post<AguinaldoRunRow>(`/aguinaldo/${id}/pay`),
  void: (id: string) => api.post<AguinaldoRunRow>(`/aguinaldo/${id}/void`),
};
