"use client";

/**
 * Vacaciones: saldos anuales (`ensure`) y solicitudes de ausencia con aprobación/rechazo.
 */

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api";
import { LeaveRequestConstraints, VacationBalanceConstraints } from "@/lib/constraints";
import { formatDate, formatNumber } from "@/lib/utils";
import type { EmployeeRow } from "@/lib/api/employees";
import type { LeaveRequestRow, LeaveTypeRow, VacationBalanceRow } from "@/lib/api/vacation";
import { useLeaveRequests, useVacationBalances } from "@/hooks/use-vacation";

type LeaveConfirmation = {
  action: "approve" | "reject";
  request: LeaveRequestRow;
};

/** Gestiona saldos, solicitudes y catálogos del módulo de vacaciones. */
export default function VacacionesContent() {
  const yearNow = new Date().getFullYear();
  const [year, setYear] = useState(yearNow);
  const [reqPage, setReqPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const { items: balances, loading: loadingBal, isError: balancesError, error: balancesQueryError, refresh: refreshBalances, ensure, ensuring } = useVacationBalances(year);
  const {
    items: requests,
    total: requestsTotal,
    pageSize: requestsPageSize,
    leaveTypes,
    employees,
    catalogsError,
    loading: loadingReq,
    isError: requestsError,
    error: requestsQueryError,
    refresh: refreshRequests,
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
  const [confirmation, setConfirmation] = useState<LeaveConfirmation | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  /** Abre la confirmación de aprobar o rechazar una solicitud de vacaciones. */
  function openConfirmation(action: LeaveConfirmation["action"], request: LeaveRequestRow) {
    setConfirmation({ action, request });
    setConfirmationError(null);
  }

  /** Ejecuta la revisión de la solicitud y conserva el diálogo ante un error. */
  async function confirmReview() {
    if (!confirmation) return;
    try {
      if (confirmation.action === "approve") {
        await approve(confirmation.request.id);
        toast.success("Solicitud aprobada");
      } else {
        await reject(confirmation.request.id);
        toast.success("Solicitud rechazada");
      }
      setConfirmation(null);
      setConfirmationError(null);
    } catch (err) {
      setConfirmationError(err instanceof ApiError ? err.message : "No se pudo revisar la solicitud");
    }
  }

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
            <FormField label="Año" id="vacation-year" constraints={VacationBalanceConstraints.year}>
              <Input
                id="vacation-year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </FormField>
          </div>
        </CardHeader>
        <CardContent className="table-container">
          {loadingBal ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : balancesError ? (
            <QueryErrorState error={balancesQueryError} onRetry={() => void refreshBalances()} compact />
          ) : balances.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin saldos. Usa “Asegurar saldos”.</p>
          ) : (
            <table className="data-table min-w-[560px]">
              <thead className="data-table__head data-table__head">
                <tr className="data-table__row data-table__row">
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Empleado</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Ganados</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Tomados</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Disponibles</th>
                </tr>
              </thead>
              <tbody className="data-table__body data-table__body">
                {balances.map((b: VacationBalanceRow) => (
                  <tr key={b.id} className="data-table__row data-table__row">
                    <td className="data-table__cell data-table__cell">{b.employeeName}</td>
                    <td className="data-table__cell data-table__cell">{formatNumber(b.daysEarned, 1)}</td>
                    <td className="data-table__cell data-table__cell">{formatNumber(b.daysTaken, 1)}</td>
                    <td className="font-medium data-table__cell data-table__cell">{formatNumber(b.daysAvailable, 1)}</td>
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
            <FormField label="Estado" id="leave-status-filter">
              <Select
                id="leave-status-filter"
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
              </Select>
            </FormField>
            <FormField label="Empleado" id="leave-employee-filter">
              <Select
                id="leave-employee-filter"
                value={employeeFilter}
                onChange={(e) => {
                  setReqPage(0);
                  setEmployeeFilter(e.target.value);
                }}
              >
                <option value="">{catalogsError ? "Error al cargar" : "Todos"}</option>
                {employees.map((e: EmployeeRow) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Tipo de ausencia" id="leave-type-filter">
              <Select
                id="leave-type-filter"
                value={leaveTypeFilter}
                onChange={(e) => {
                  setReqPage(0);
                  setLeaveTypeFilter(e.target.value);
                }}
              >
                <option value="">{catalogsError ? "Error al cargar" : "Todos"}</option>
                {leaveTypes.map((t: LeaveTypeRow) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </FormField>
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
          <div className="table-container">
          {loadingReq ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : requestsError ? (
            <QueryErrorState error={requestsQueryError} onRetry={() => void refreshRequests()} />
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin solicitudes.</p>
          ) : (
            <table className="data-table min-w-[720px]">
              <thead className="data-table__head data-table__head">
                <tr className="data-table__row data-table__row">
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Empleado</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Tipo</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Fechas</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Días</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Estado</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Acciones</th>
                </tr>
              </thead>
              <tbody className="data-table__body data-table__body">
                {requests.map((r: LeaveRequestRow) => (
                  <tr key={r.id} className="data-table__row data-table__row">
                    <td className="data-table__cell data-table__cell">{r.employeeName}</td>
                    <td className="data-table__cell data-table__cell">{r.leaveTypeName}</td>
                    <td className="data-table__cell data-table__cell">
                      {formatDate(r.startDate)} → {formatDate(r.endDate)}
                    </td>
                    <td className="data-table__cell data-table__cell">{formatNumber(r.daysRequested, 1)}</td>
                    <td className="data-table__cell data-table__cell"><StatusBadge status={r.status} /></td>
                    <td className="data-table__cell data-table__cell">
                      {r.status === "PENDIENTE" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={submitting}
                            onClick={() => openConfirmation("approve", r)}
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={submitting}
                            onClick={() => openConfirmation("reject", r)}
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

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Nueva solicitud"
        size="md"
        footer={
          <ModalFooter
            cancel={<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>}
            action={<Button type="submit" form="leave-request-form" loading={submitting} loadingText="Guardando…">Guardar</Button>}
          />
        }
      >
        <form id="leave-request-form" className="grid gap-3" onSubmit={onCreate}>
          <FormField label="Empleado" name="employeeId" required={LeaveRequestConstraints.employeeId.required} placeholder="Selecciona un empleado" constraints={LeaveRequestConstraints.employeeId}>
            <Select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">{catalogsError ? "Error al cargar" : "—"}</option>
              {employees.map((e: EmployeeRow) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Tipo" name="leaveTypeId" required={LeaveRequestConstraints.leaveTypeId.required} placeholder="Selecciona un tipo" constraints={LeaveRequestConstraints.leaveTypeId}>
            <Select
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
            >
              <option value="">{catalogsError ? "Error al cargar" : "—"}</option>
              {leaveTypes
                .filter((t: LeaveTypeRow) => t.isActive !== false)
                .map((t: LeaveTypeRow) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Desde" name="startDate" required={LeaveRequestConstraints.startDate.required} constraints={LeaveRequestConstraints.startDate}>
              <Input
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormField>
            <FormField label="Hasta" name="endDate" required={LeaveRequestConstraints.endDate.required} constraints={LeaveRequestConstraints.endDate}>
              <Input
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Días" name="daysRequested" required={LeaveRequestConstraints.daysRequested.required} placeholder="Ej. 1" constraints={LeaveRequestConstraints.daysRequested}>
            <Input
              value={daysRequested}
              onChange={(e) => setDaysRequested(e.target.value)}
            />
          </FormField>
          <FormField label="Motivo" name="reason" placeholder="Motivo de la ausencia" constraints={LeaveRequestConstraints.reason}>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmation != null}
        title={confirmation?.action === "reject" ? "Rechazar solicitud de vacaciones" : "Aprobar solicitud de vacaciones"}
        description={
          confirmation
            ? confirmation.action === "reject"
              ? `¿Rechazar la solicitud de ${confirmation.request.employeeName} del ${confirmation.request.startDate.slice(0, 10)} al ${confirmation.request.endDate.slice(0, 10)}? La solicitud quedará rechazada.`
              : `¿Aprobar la solicitud de ${confirmation.request.employeeName} del ${confirmation.request.startDate.slice(0, 10)} al ${confirmation.request.endDate.slice(0, 10)}? Se descontarán ${confirmation.request.daysRequested} días del saldo disponible.`
            : "Confirma la revisión de la solicitud."
        }
        confirmLabel={confirmation?.action === "reject" ? "Rechazar" : "Aprobar"}
        destructive={confirmation?.action === "reject"}
        loading={submitting}
        error={confirmationError}
        onConfirm={() => void confirmReview()}
        onCancel={() => {
          if (!submitting) {
            setConfirmation(null);
            setConfirmationError(null);
          }
        }}
      />
    </div>
  );
}
