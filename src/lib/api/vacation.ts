import { api } from "@/lib/api";

export type VacationBalanceRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  year: number;
  daysEarned: string | number;
  daysTaken: string | number;
  daysAvailable: string | number;
  lastVacationDate?: string | null;
  nextVacationDue?: string | null;
  updatedAt: string;
};

export type EnsureVacationBalancesInput = { year: number };
export type EnsureVacationBalancesResult = { created: number; totalEligible: number };

export type UpdateVacationBalanceInput = Partial<{
  daysEarned: number;
  daysTaken: number;
  lastVacationDate: string | null;
  nextVacationDue: string | null;
}>;

export const vacationBalancesApi = {
  list: (params?: { year?: number; employeeId?: string }) => {
    const search = new URLSearchParams();
    if (params?.year) search.set("year", String(params.year));
    if (params?.employeeId) search.set("employeeId", params.employeeId);
    const qs = search.toString();
    return api.get<VacationBalanceRow[]>(`/vacation-balances${qs ? `?${qs}` : ""}`);
  },
  ensure: (data: EnsureVacationBalancesInput) =>
    api.post<EnsureVacationBalancesResult>("/vacation-balances/ensure", data),
  update: (id: string, data: UpdateVacationBalanceInput) =>
    api.patch<VacationBalanceRow>(`/vacation-balances/${id}`, data),
};

export type LeaveCategory =
  | "VACACIONES"
  | "PERMISO_CON_GOCE"
  | "PERMISO_SIN_GOCE"
  | "BAJA_MEDICA"
  | "INCAPACIDAD_LABORAL"
  | "MATERNIDAD"
  | "PATERNIDAD"
  | "SUSPENSION_DISCIPLINARIA";

export type LeaveTypeRow = {
  id: string;
  name: string;
  category: LeaveCategory;
  maxDaysPerYear: number | null;
  requiresDocument: boolean;
  isPaid: boolean;
  affectsVacationAccrual: boolean;
  legalBasis?: string | null;
  isActive: boolean;
  createdAt: string;
};

export type CreateLeaveTypeInput = {
  name: string;
  category: LeaveCategory;
  maxDaysPerYear?: number | null;
  requiresDocument?: boolean;
  isPaid?: boolean;
  affectsVacationAccrual?: boolean;
  legalBasis?: string | null;
};

export type UpdateLeaveTypeInput = Partial<CreateLeaveTypeInput> & { isActive?: boolean };

export const leaveTypesApi = {
  list: (params?: { isActive?: boolean }) => {
    const search = new URLSearchParams();
    if (params?.isActive !== undefined) search.set("isActive", String(params.isActive));
    const qs = search.toString();
    return api.get<LeaveTypeRow[]>(`/leave-types${qs ? `?${qs}` : ""}`);
  },
  create: (data: CreateLeaveTypeInput) => api.post<LeaveTypeRow>("/leave-types", data),
  update: (id: string, data: UpdateLeaveTypeInput) => api.patch<LeaveTypeRow>(`/leave-types/${id}`, data),
};

export type LeaveRequestStatus = "PENDIENTE" | "APROBADA" | "RECHAZADA" | "EN_GOCE";

export type LeaveRequestRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCategory: LeaveCategory;
  leaveTypeIsPaid: boolean;
  startDate: string;
  endDate: string;
  daysRequested: string | number;
  halfDay: boolean;
  halfDayPeriod?: string | null;
  reason?: string | null;
  documentUrl?: string | null;
  status: LeaveRequestStatus;
  requestedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
};

export type CreateLeaveRequestInput = {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  halfDay?: boolean;
  halfDayPeriod?: string;
  reason?: string;
  documentUrl?: string;
};

export const leaveRequestsApi = {
  list: (params?: { employeeId?: string; status?: LeaveRequestStatus; leaveTypeId?: string }) => {
    const search = new URLSearchParams();
    if (params?.employeeId) search.set("employeeId", params.employeeId);
    if (params?.status) search.set("status", params.status);
    if (params?.leaveTypeId) search.set("leaveTypeId", params.leaveTypeId);
    const qs = search.toString();
    return api.get<LeaveRequestRow[]>(`/leave-requests${qs ? `?${qs}` : ""}`);
  },
  create: (data: CreateLeaveRequestInput) => api.post<LeaveRequestRow>("/leave-requests", data),
  approve: (id: string, reviewNotes?: string) =>
    api.post<LeaveRequestRow>(`/leave-requests/${id}/approve`, reviewNotes ? { reviewNotes } : undefined),
  reject: (id: string, reviewNotes?: string) =>
    api.post<LeaveRequestRow>(`/leave-requests/${id}/reject`, reviewNotes ? { reviewNotes } : undefined),
};
