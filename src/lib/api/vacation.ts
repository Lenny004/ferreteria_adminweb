import { api } from "@/lib/api";

export type VacationBalanceRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  year: number;
  daysEarned: number;
  daysTaken: number;
  daysAvailable: number;
  lastVacationDate?: string | null;
  nextVacationDue?: string | null;
  updatedAt: string;
};

export type LeaveTypeRow = {
  id: string;
  name: string;
  category: string;
  maxDaysPerYear?: number | string | null;
  requiresDocument: boolean;
  isPaid: boolean;
  affectsVacationAccrual: boolean;
  legalBasis?: string | null;
  isActive: boolean;
};

export type LeaveRequestStatus = "PENDIENTE" | "APROBADA" | "RECHAZADA" | "EN_GOCE";

export type LeaveRequestRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCategory: string;
  leaveTypeIsPaid: boolean;
  startDate: string;
  endDate: string;
  daysRequested: number;
  halfDay: boolean;
  reason?: string | null;
  status: LeaveRequestStatus;
  requestedAt: string;
  reviewNotes?: string | null;
  approvedAt?: string | null;
};

export const vacationApi = {
  listBalances: (params?: { year?: number; employeeId?: string }) => {
    const search = new URLSearchParams();
    if (params?.year) search.set("year", String(params.year));
    if (params?.employeeId) search.set("employeeId", params.employeeId);
    const qs = search.toString();
    return api.get<VacationBalanceRow[]>(`/vacation-balances${qs ? `?${qs}` : ""}`);
  },
  ensureBalances: (year: number) =>
    api.post<{ created: number; year: number }>("/vacation-balances/ensure", { year }),
  updateBalance: (
    id: string,
    data: { daysEarned?: number; daysTaken?: number },
  ) => api.patch<VacationBalanceRow>(`/vacation-balances/${id}`, data),
  listLeaveTypes: () => api.get<LeaveTypeRow[]>("/leave-types"),
  listLeaveRequests: (params?: { status?: string; employeeId?: string }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.employeeId) search.set("employeeId", params.employeeId);
    const qs = search.toString();
    return api.get<LeaveRequestRow[]>(`/leave-requests${qs ? `?${qs}` : ""}`);
  },
  createLeaveRequest: (data: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    daysRequested: number;
    reason?: string;
  }) => api.post<LeaveRequestRow>("/leave-requests", data),
  approveLeaveRequest: (id: string, reviewNotes?: string) =>
    api.post<LeaveRequestRow>(`/leave-requests/${id}/approve`, { reviewNotes }),
  rejectLeaveRequest: (id: string, reviewNotes?: string) =>
    api.post<LeaveRequestRow>(`/leave-requests/${id}/reject`, { reviewNotes }),
};
