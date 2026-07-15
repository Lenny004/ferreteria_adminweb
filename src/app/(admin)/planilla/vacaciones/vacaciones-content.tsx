"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { ModuleSubnav, PLANILLA_SUBNAV } from "@/components/layout/module-subnav";
import { ApiError } from "@/lib/api";
import type { EmployeeRow } from "@/lib/api/employees";
import type { LeaveRequestRow, LeaveTypeRow, VacationBalanceRow } from "@/lib/api/vacation";
import { useLeaveRequests, useVacationBalances } from "@/hooks/use-vacation";

export default function VacacionesContent() {
  const yearNow = new Date().getFullYear();
  const [year, setYear] = useState(yearNow);
  const [reqPage, setReqPage] = useState(0);
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
  } = useLeaveRequests(undefined, reqPage);

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
    <div className="space-y-6">
      <ModuleSubnav items={PLANILLA_SUBNAV} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Vacaciones</h1>
          <p className="text-sm text-muted-foreground">
            Saldos anuales (15 días SV) y solicitudes de ausencia.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={ensuring} onClick={onEnsure}>
            Asegurar saldos {year}
          </Button>
          <Button onClick={() => setOpen(true)}>Nueva solicitud</Button>
        </div>
      </div>

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
        <CardContent className="overflow-x-auto">
          {loadingBal ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : balances.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin saldos. Usa “Asegurar saldos”.</p>
          ) : (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Empleado</th>
                  <th className="pb-2 pr-3 font-medium">Ganados</th>
                  <th className="pb-2 pr-3 font-medium">Tomados</th>
                  <th className="pb-2 font-medium">Disponibles</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b: VacationBalanceRow) => (
                  <tr key={b.id} className="border-b border-border/60">
                    <td className="py-2 pr-3">{b.employeeName}</td>
                    <td className="py-2 pr-3">{b.daysEarned}</td>
                    <td className="py-2 pr-3">{b.daysTaken}</td>
                    <td className="py-2 font-medium">{b.daysAvailable}</td>
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
        <CardContent className="overflow-x-auto">
          {loadingReq ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin solicitudes.</p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Empleado</th>
                  <th className="pb-2 pr-3 font-medium">Tipo</th>
                  <th className="pb-2 pr-3 font-medium">Fechas</th>
                  <th className="pb-2 pr-3 font-medium">Días</th>
                  <th className="pb-2 pr-3 font-medium">Estado</th>
                  <th className="pb-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r: LeaveRequestRow) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-2 pr-3">{r.employeeName}</td>
                    <td className="py-2 pr-3">{r.leaveTypeName}</td>
                    <td className="py-2 pr-3">
                      {r.startDate.slice(0, 10)} → {r.endDate.slice(0, 10)}
                    </td>
                    <td className="py-2 pr-3">{r.daysRequested}</td>
                    <td className="py-2 pr-3">{r.status}</td>
                    <td className="py-2">
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
        </CardContent>
      </Card>

      <Modal open={open} onOpenChange={setOpen} title="Nueva solicitud" size="md">
        <form className="grid gap-3" onSubmit={onCreate}>
          <label className="grid gap-1 text-sm">
            <span>Empleado</span>
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
            <span>Tipo</span>
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
              <span>Desde</span>
              <input
                type="date"
                required
                className="h-10 rounded-md border border-border px-3"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Hasta</span>
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
            <span>Días</span>
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
