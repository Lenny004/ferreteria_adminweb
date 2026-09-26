/**
 * Planilla (períodos, corridas y exportaciones) — cliente HTTP hacia `/payroll-periods`, `/payroll-runs`.
 */

import { api, ApiError, getAccessToken } from "@/lib/api";

export type PayrollPeriodType = "MENSUAL" | "QUINCENAL" | "SEMANAL";

export type PayrollPeriodRow = {
  id: string;
  name: string;
  periodType: PayrollPeriodType;
  startDate: string;
  endDate: string;
  paymentDate: string;
  isClosed: boolean;
  closedAt?: string | null;
  closedBy?: string | null;
  runsCount: number;
  createdAt: string;
};

export type CreatePayrollPeriodInput = {
  name: string;
  periodType: PayrollPeriodType;
  startDate: string;
  endDate: string;
  paymentDate: string;
};

export type UpdatePayrollPeriodInput = Partial<CreatePayrollPeriodInput>;

export type PayrollRunStatus = "EN_REVISION" | "APROBADA" | "PAGADA" | "ANULADA";

export type PayrollRunRow = {
  id: string;
  periodId: string;
  periodName: string;
  periodType: string;
  name: string;
  notes?: string | null;
  status: PayrollRunStatus;
  totalGross: string | number;
  totalAfpEmp: string | number;
  totalAfpPat: string | number;
  totalIsssEmp: string | number;
  totalIsssPat: string | number;
  totalIsr: string | number;
  totalDeductions: string | number;
  totalNet: string | number;
  totalPatronal: string | number;
  employeeCount: number;
  createdBy?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  paidBy?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type PayrollDetailRow = {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  positionName?: string | null;
  contractType?: string | null;
  baseSalary: string | number;
  salaryType: string;
  daysWorked: string | number;
  daysAbsent: string | number;
  daysVacation: string | number;
  daysSick: string | number;
  daysPermission: string | number;
  ordinarySalary: string | number;
  overtimeHoursDiurnal: string | number;
  overtimeHoursNocturnal: string | number;
  overtimeHoursHoliday: string | number;
  overtimeAmount: string | number;
  bonuses: string | number;
  viaticos: string | number;
  vacationPay: string | number;
  vacationSurcharge: string | number;
  aguinaldo: string | number;
  otherEarnings: string | number;
  totalGross: string | number;
  afpEmployeeAmount: string | number;
  isssEmployeeAmount: string | number;
  isrTaxableIncome: string | number;
  isrAmount: string | number;
  loanDeduction: string | number;
  otherDeductions: string | number;
  totalDeductions: string | number;
  afpEmployerAmount: string | number;
  isssEmployerAmount: string | number;
  insaforpAmount: string | number;
  totalEmployerCost: string | number;
  netPay: string | number;
  paymentChannel?: string | null;
  notes?: string | null;
  isProbation: boolean;
};

export type PayrollRunDetailResponse = PayrollRunRow & { details: PayrollDetailRow[] };

export type GeneratePayrollRunInput = {
  periodId: string;
  name?: string;
  notes?: string;
  employeeIds?: string[];
};

export type UpdatePayrollDetailInput = Partial<{
  overtimeHoursDiurnal: number;
  overtimeHoursNocturnal: number;
  overtimeHoursHoliday: number;
  bonuses: number;
  viaticos: number;
  loanDeduction: number;
  otherDeductions: number;
  otherEarnings: number;
  paymentChannel: "DEPOSITO_BANCARIO" | "EFECTIVO" | "CHEQUE";
  notes: string;
}>;

/** CRUD y cierre de períodos de planilla. */
export const payrollPeriodsApi = {
  /** Lista períodos (`periodType`, `year`, `isClosed`). */
  list: (params?: { periodType?: PayrollPeriodType; year?: number; isClosed?: boolean }) => {
    const search = new URLSearchParams();
    if (params?.periodType) search.set("periodType", params.periodType);
    if (params?.year) search.set("year", String(params.year));
    if (params?.isClosed !== undefined) search.set("isClosed", String(params.isClosed));
    const qs = search.toString();
    return api.get<PayrollPeriodRow[]>(`/payroll-periods${qs ? `?${qs}` : ""}`);
  },
  /** Obtiene un período por id. */
  getById: (id: string) => api.get<PayrollPeriodRow>(`/payroll-periods/${id}`),
  /** Crea un período de planilla. */
  create: (data: CreatePayrollPeriodInput) => api.post<PayrollPeriodRow>("/payroll-periods", data),
  /** Actualiza un período abierto. */
  update: (id: string, data: UpdatePayrollPeriodInput) =>
    api.patch<PayrollPeriodRow>(`/payroll-periods/${id}`, data),
  /** Cierra el período (no admite más corridas). */
  close: (id: string) => api.post<PayrollPeriodRow>(`/payroll-periods/${id}/close`),
  /** Reabre un período cerrado. */
  reopen: (id: string) => api.post<PayrollPeriodRow>(`/payroll-periods/${id}/reopen`),
};

/** Generación, aprobación y pago de corridas de planilla. */
export const payrollRunsApi = {
  /** Lista corridas (`periodId`, `status`, `take`, `skip`). */
  list: (params?: {
    periodId?: string;
    status?: PayrollRunStatus;
    take?: number;
    skip?: number;
  }) => {
    const search = new URLSearchParams();
    if (params?.periodId) search.set("periodId", params.periodId);
    if (params?.status) search.set("status", params.status);
    if (params?.take != null) search.set("take", String(params.take));
    if (params?.skip != null) search.set("skip", String(params.skip));
    const qs = search.toString();
    return api.get<{ items: PayrollRunRow[]; total: number; take: number; skip: number }>(
      `/payroll-runs${qs ? `?${qs}` : ""}`,
    );
  },
  /** Obtiene una corrida con detalle por empleado. */
  getById: (id: string) => api.get<PayrollRunDetailResponse>(`/payroll-runs/${id}`),
  /** Genera una corrida para un período. */
  generate: (data: GeneratePayrollRunInput) => api.post<PayrollRunRow>("/payroll-runs", data),
  /** Ajusta líneas de detalle (horas extra, bonos, deducciones). */
  updateDetail: (id: string, data: UpdatePayrollDetailInput) =>
    api.patch<PayrollDetailRow>(`/payroll-runs/details/${id}`, data),
  /** Aprueba la corrida calculada. */
  approve: (id: string) => api.post<PayrollRunRow>(`/payroll-runs/${id}/approve`),
  /** Marca la corrida como pagada. */
  pay: (id: string) => api.post<PayrollRunRow>(`/payroll-runs/${id}/pay`),
  /** Anula la corrida. */
  void: (id: string) => api.post<PayrollRunRow>(`/payroll-runs/${id}/void`),
  /** Elimina una corrida en revisión. */
  remove: (id: string) => api.delete<void>(`/payroll-runs/${id}`),
};

// ─── Exportación de archivos (Excel/PDF) ──────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

/** Extrae el nombre de archivo de un header `Content-Disposition: attachment; filename="…"`. */
function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const match = /filename="?([^"]+)"?/i.exec(header);
  return match?.[1] ?? null;
}

/** Dispara la descarga de un `Blob` en el navegador simulando un click en un `<a>` temporal. */
function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Descarga un archivo binario (Excel/PDF) del backend autenticado con Bearer token.
 * A diferencia de `api.*`, NO intenta parsear la respuesta como JSON `{ success, data }`.
 */
async function downloadPayrollFile(path: string, fallbackFilename: string): Promise<void> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    let message = `Error HTTP ${response.status}`;
    let code: string | undefined;
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      message = body?.message ?? message;
      code = body?.error;
    } catch {
      // Respuesta no es JSON (p. ej. error antes de generar el binario); usar mensaje genérico.
    }
    throw new ApiError(message, response.status, code);
  }

  const blob = await response.blob();
  const filename = filenameFromContentDisposition(response.headers.get("Content-Disposition")) ?? fallbackFilename;
  triggerBrowserDownload(blob, filename);
}

/** Descargas binarias (Excel/PDF) de una corrida de planilla. */
export const payrollExportsApi = {
  /** Exporta la planilla completa en Excel. */
  downloadExcel: (runId: string) =>
    downloadPayrollFile(`/payroll-runs/${runId}/export/excel`, `planilla-${runId}.xlsx`),
  /** Descarga boletas de pago en PDF. */
  downloadReceiptsPdf: (runId: string) =>
    downloadPayrollFile(`/payroll-runs/${runId}/export/receipts-pdf`, `boletas-${runId}.pdf`),
  /** Descarga formato planilla única en Excel. */
  downloadPlanillaUnica: (runId: string) =>
    downloadPayrollFile(`/payroll-runs/${runId}/export/planilla-unica`, `planilla-unica-${runId}.xlsx`),
};
