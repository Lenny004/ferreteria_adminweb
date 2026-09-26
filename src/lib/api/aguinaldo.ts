/**
 * Aguinaldo anual — cliente HTTP hacia `/aguinaldo`.
 */

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

/** Generación y aprobación de corridas de aguinaldo. */
export const aguinaldoApi = {
  /** Lista corridas (`take`, `skip`). */
  list: (params?: { take?: number; skip?: number }) => {
    const search = new URLSearchParams();
    if (params?.take != null) search.set("take", String(params.take));
    if (params?.skip != null) search.set("skip", String(params.skip));
    const qs = search.toString();
    return api.get<{ items: AguinaldoRunRow[]; total: number; take: number; skip: number }>(
      `/aguinaldo${qs ? `?${qs}` : ""}`,
    );
  },
  /** Obtiene una corrida con detalle por empleado. */
  getById: (id: string) => api.get<AguinaldoRunDetailResponse>(`/aguinaldo/${id}`),
  /** Genera la corrida de aguinaldo para un año. */
  generate: (data: GenerateAguinaldoInput) => api.post<AguinaldoRunRow>("/aguinaldo", data),
  /** Aprueba la corrida generada. */
  approve: (id: string) => api.post<AguinaldoRunRow>(`/aguinaldo/${id}/approve`),
  /** Marca la corrida como pagada. */
  pay: (id: string) => api.post<AguinaldoRunRow>(`/aguinaldo/${id}/pay`),
  /** Anula la corrida. */
  void: (id: string) => api.post<AguinaldoRunRow>(`/aguinaldo/${id}/void`),
};
