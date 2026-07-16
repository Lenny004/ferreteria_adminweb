/**
 * Vacaciones y permisos — cliente HTTP hacia `/vacation-balances`, `/leave-types`, `/leave-requests`.
 */

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

/** Saldos de vacaciones, tipos de permiso y solicitudes de ausencia. */
export const vacationApi = {
  /** Lista saldos (`year`, `employeeId`). */
  listBalances: (params?: { year?: number; employeeId?: string }) => {
    const search = new URLSearchParams();
    if (params?.year) search.set("year", String(params.year));
    if (params?.employeeId) search.set("employeeId", params.employeeId);
    const qs = search.toString();
    return api.get<VacationBalanceRow[]>(`/vacation-balances${qs ? `?${qs}` : ""}`);
  },
  /** Crea saldos faltantes para el año indicado. */
  ensureBalances: (year: number) =>
    api.post<{ created: number; totalEligible: number }>("/vacation-balances/ensure", { year }),
  /** Ajusta días ganados o tomados de un saldo. */
  updateBalance: (
    id: string,
    data: { daysEarned?: number; daysTaken?: number },
  ) => api.patch<VacationBalanceRow>(`/vacation-balances/${id}`, data),
  /** Lista tipos de permiso/ausencia. */
  listLeaveTypes: () => api.get<LeaveTypeRow[]>("/leave-types"),
  /** Lista solicitudes (`status`, `employeeId`, `take`, `skip`). */
  listLeaveRequests: (params?: {
    status?: string;
    employeeId?: string;
    take?: number;
    skip?: number;
  }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.employeeId) search.set("employeeId", params.employeeId);
    if (params?.take != null) search.set("take", String(params.take));
    if (params?.skip != null) search.set("skip", String(params.skip));
    const qs = search.toString();
    return api.get<{
      items: LeaveRequestRow[];
      total: number;
      take: number;
      skip: number;
    }>(`/leave-requests${qs ? `?${qs}` : ""}`);
  },
  /** Crea una solicitud de permiso o vacación. */
  createLeaveRequest: (data: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    daysRequested: number;
    reason?: string;
  }) => api.post<LeaveRequestRow>("/leave-requests", data),
  /** Aprueba una solicitud pendiente. */
  approveLeaveRequest: (id: string, reviewNotes?: string) =>
    api.post<LeaveRequestRow>(`/leave-requests/${id}/approve`, { reviewNotes }),
  /** Rechaza una solicitud pendiente. */
  rejectLeaveRequest: (id: string, reviewNotes?: string) =>
    api.post<LeaveRequestRow>(`/leave-requests/${id}/reject`, { reviewNotes }),
};
