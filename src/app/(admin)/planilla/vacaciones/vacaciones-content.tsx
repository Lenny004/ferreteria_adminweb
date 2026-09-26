"use client";

/**
 * Vacaciones: saldos anuales (`ensure`) y solicitudes de ausencia con aprobación/rechazo.
 */

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api";
import type { EmployeeRow } from "@/lib/api/employees";
import type { LeaveRequestRow, LeaveTypeRow, VacationBalanceRow } from "@/lib/api/vacation";
import { useLeaveRequests, useVacationBalances } from "@/hooks/use-vacation";

export default function VacacionesContent() {
  const yearNow = new Date().getFullYear();
  const [year, setYear] = useState(yearNow);
  const [reqPage, setReqPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const { items: balances, loading: loadingBal, ensure, ensuring } = useVacationBalances(year);
  const {
    items: requests,
    total: requestsTotal,
    pageSize: requestsPageSize,
    leaveTypes,
    employees,
    loading: loadingReq,
    create,
    approve,
    reject,
    submitting,
  } = useLeaveRequests(
    {
      status: pendingOnly ? "PENDIENTE" : statusFilter || undefined,
      employeeId: employeeFilter || undefined,
      leaveTypeId: leaveTypeFilter || undefined,
    },
    reqPage,
  );

  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [daysRequested, setDaysRequested] = useState("1");
  const [reason, setReason] = useState("");

  async function onEnsure() {
    try {
      const res = await ensure(year);
      toast.success(`Saldos: ${res.created} creados de ${res.totalEligible} elegibles`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo asegurar");
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await create({
        employeeId,
        leaveTypeId,
        startDate,
        endDate,
        daysRequested: Number(daysRequested),
        reason: reason.trim() || undefined,
      });
      toast.success("Solicitud creada");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo crear");
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Vacaciones"
        description="Saldos anuales (15 días SV) y solicitudes de ausencia."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" disabled={ensuring} onClick={onEnsure}>
              Asegurar saldos {year}
            </Button>
            <Button onClick={() => setOpen(true)}>Nueva solicitud</Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Saldos {year}</CardTitle>
            <input
              type="number"
              className="h-9 w-24 rounded-md border border-border px-2 text-sm"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        </CardHeader>
        <CardContent className="data-table-wrap">
          {loadingBal ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : balances.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin saldos. Usa “Asegurar saldos”.</p>
          ) : (
            <table className="data-table min-w-[560px]">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Ganados</th>
                  <th>Tomados</th>
                  <th>Disponibles</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b: VacationBalanceRow) => (
                  <tr key={b.id}>
                    <td>{b.employeeName}</td>
                    <td>{b.daysEarned}</td>
                    <td>{b.daysTaken}</td>
                    <td className="font-medium">{b.daysAvailable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Solicitudes</CardTitle>
          <CardDescription>Al aprobar vacaciones se descuenta el saldo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Estado</span>
              <select
                className="h-10 rounded-md border border-border px-3"
                value={pendingOnly ? "PENDIENTE" : statusFilter}
                disabled={pendingOnly}
                onChange={(e) => {
                  setReqPage(0);
                  setStatusFilter(e.target.value);
                }}
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="APROBADA">Aprobada</option>
                <option value="RECHAZADA">Rechazada</option>
                <option value="EN_GOCE">En goce</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Empleado</span>
              <select
                className="h-10 rounded-md border border-border px-3"
                value={employeeFilter}
                onChange={(e) => {
                  setReqPage(0);
                  setEmployeeFilter(e.target.value);
                }}
              >
                <option value="">Todos</option>
                {employees.map((e: EmployeeRow) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Tipo de ausencia</span>
              <select
                className="h-10 rounded-md border border-border px-3"
                value={leaveTypeFilter}
                onChange={(e) => {
                  setReqPage(0);
                  setLeaveTypeFilter(e.target.value);
                }}
              >
                <option value="">Todos</option>
                {leaveTypes.map((t: LeaveTypeRow) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <input
                type="checkbox"
                checked={pendingOnly}
                onChange={(e) => {
                  setReqPage(0);
                  setPendingOnly(e.target.checked);
                  if (e.target.checked) setStatusFilter("");
                }}
              />
              Solo pendientes de revisión
            </label>
          </div>
          <div className="data-table-wrap">
          {loadingReq ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin solicitudes.</p>
          ) : (
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Tipo</th>
                  <th>Fechas</th>
                  <th>Días</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r: LeaveRequestRow) => (
                  <tr key={r.id}>
                    <td>{r.employeeName}</td>
                    <td>{r.leaveTypeName}</td>
                    <td>
                      {r.startDate.slice(0, 10)} → {r.endDate.slice(0, 10)}
                    </td>
                    <td>{r.daysRequested}</td>
                    <td>{r.status}</td>
                    <td>
                      {r.status === "PENDIENTE" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={submitting}
                            onClick={async () => {
                              try {
                                await approve(r.id);
                                toast.success("Aprobada");
                              } catch (err) {
                                toast.error(
                                  err instanceof ApiError ? err.message : "Error",
                                );
                              }
                            }}
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={submitting}
                            onClick={async () => {
                              try {
                                await reject(r.id);
                                toast.success("Rechazada");
                              } catch (err) {
                                toast.error(
                                  err instanceof ApiError ? err.message : "Error",
                                );
                              }
                            }}
                          >
                            Rechazar
                          </Button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination
            page={reqPage}
            pageSize={requestsPageSize}
            total={requestsTotal}
            onPageChange={setReqPage}
          />
          </div>
        </CardContent>
      </Card>

      <Modal open={open} onOpenChange={setOpen} title="Nueva solicitud" size="md">
        <form className="grid gap-3" onSubmit={onCreate}>
          <label className="grid gap-1 text-sm">
            <span>Empleado *</span>
            <select
              required
              className="h-10 rounded-md border border-border px-3"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">—</option>
              {employees.map((e: EmployeeRow) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Tipo *</span>
            <select
              required
              className="h-10 rounded-md border border-border px-3"
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
            >
              <option value="">—</option>
              {leaveTypes
                .filter((t: LeaveTypeRow) => t.isActive !== false)
                .map((t: LeaveTypeRow) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span>Desde *</span>
              <input
                type="date"
                required
                className="h-10 rounded-md border border-border px-3"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Hasta *</span>
              <input
                type="date"
                required
                className="h-10 rounded-md border border-border px-3"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span>Días *</span>
            <input
              type="number"
              min={0.5}
              step="0.5"
              required
              className="h-10 rounded-md border border-border px-3"
              value={daysRequested}
              onChange={(e) => setDaysRequested(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Motivo</span>
            <input
              className="h-10 rounded-md border border-border px-3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
