/**
 * Finiquitos/liquidaciones: cálculo por motivo de salida y flujo EN_REVISIÓN → APROBADA → PAGADA.
 */
"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import type { EmployeeRow } from "@/lib/api/employees";
import {
  TERMINATION_REASONS,
  type TerminationReason,
  type TerminationRow,
  type TerminationStatus,
} from "@/lib/api/terminations";
import { useTerminations } from "@/hooks/use-terminations";

const STATUS_LABEL: Record<TerminationStatus, string> = {
  EN_REVISION: "En revisión",
  APROBADA: "Aprobada",
  PAGADA: "Pagada",
  ANULADA: "Anulada",
};

const REASON_LABEL: Record<TerminationReason, string> = {
  RENUNCIA_VOLUNTARIA: "Renuncia",
  DESPIDO_JUSTIFICADO: "Despido justificado",
  DESPIDO_INJUSTIFICADO: "Despido injustificado",
  MUTUO_ACUERDO: "Mutuo acuerdo",
  VENCIMIENTO_CONTRATO: "Vencimiento contrato",
  FALLECIMIENTO: "Fallecimiento",
  JUBILACION: "Jubilación",
};

type TerminationConfirmation = {
  action: "approve" | "pay" | "void";
  row: TerminationRow;
};

/** Lista y gestiona liquidaciones laborales y sus aprobaciones. */
export default function LiquidacionesContent() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<TerminationStatus | "">("");
  const [reasonFilter, setReasonFilter] = useState<TerminationReason | "">("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const {
    items,
    total,
    pageSize,
    employees,
    loading,
    isError,
    error,
    refresh,
    employeesError,
    create,
    approve,
    pay,
    voidTermination,
    submitting,
  } = useTerminations(page);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<TerminationConfirmation | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [terminationDate, setTerminationDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [reason, setReason] = useState<TerminationReason>("RENUNCIA_VOLUNTARIA");
  const [pendingSalary, setPendingSalary] = useState("0");
  const [notes, setNotes] = useState("");

  /** Abre la confirmación de una transición de la liquidación seleccionada. */
  function openConfirmation(action: TerminationConfirmation["action"], row: TerminationRow) {
    setConfirmation({ action, row });
    setConfirmationError(null);
    if (action === "void") setVoidReason("");
  }

  /** Ejecuta la transición y deja el error dentro del diálogo para reintentar. */
  async function confirmTransition() {
    if (!confirmation) return;
    try {
      if (confirmation.action === "approve") {
        await approve(confirmation.row.id);
        toast.success("Liquidación aprobada");
      } else if (confirmation.action === "pay") {
        await pay(confirmation.row.id);
        toast.success("Liquidación pagada");
      } else {
        await voidTermination({ id: confirmation.row.id, reason: voidReason.trim() });
        toast.success("Liquidación anulada");
      }
      setConfirmation(null);
      setConfirmationError(null);
      setVoidReason("");
    } catch (err) {
      setConfirmationError(err instanceof ApiError ? err.message : "No se pudo actualizar la liquidación");
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await create({
        employeeId,
        terminationDate,
        reason,
        pendingSalary: Number(pendingSalary) || 0,
        settlementNotes: notes.trim() || undefined,
      });
      toast.success("Liquidación creada");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo crear");
    }
  }

  const visibleItems = items.filter((row) => {
    if (pendingOnly && row.status !== "EN_REVISION") return false;
    if (!pendingOnly && statusFilter && row.status !== statusFilter) return false;
    if (reasonFilter && row.reason !== reasonFilter) return false;
    return true;
  });

  return (
    <div className="page-stack">
      <PageHeader
        title="Liquidaciones"
        description="Finiquitos SV. Indemnización solo en despido injustificado. Empleado se desactiva al aprobar."
        actions={<Button onClick={() => setOpen(true)}>Nueva liquidación</Button>}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Estado</span>
              <select
                className="h-10 rounded-md border border-border px-3 text-sm"
                value={pendingOnly ? "EN_REVISION" : statusFilter}
                disabled={pendingOnly}
                onChange={(e) =>
                  setStatusFilter(e.target.value as TerminationStatus | "")
                }
              >
                <option value="">Todos</option>
                {(Object.keys(STATUS_LABEL) as TerminationStatus[]).map((k) => (
                  <option key={k} value={k}>
                    {STATUS_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Motivo</span>
              <select
                className="h-10 rounded-md border border-border px-3 text-sm"
                value={reasonFilter}
                onChange={(e) =>
                  setReasonFilter(e.target.value as TerminationReason | "")
                }
              >
                <option value="">Todos</option>
                {(Object.keys(REASON_LABEL) as TerminationReason[]).map((k) => (
                  <option key={k} value={k}>
                    {REASON_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <input
                type="checkbox"
                checked={pendingOnly}
                onChange={(e) => {
                  setPendingOnly(e.target.checked);
                  if (e.target.checked) setStatusFilter("");
                }}
              />
              Solo en revisión
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Listado ({statusFilter || reasonFilter || pendingOnly ? visibleItems.length : total})
          </CardTitle>
        </CardHeader>
        <CardContent className="table-container">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : isError ? (
            <QueryErrorState error={error} onRetry={() => void refresh()} />
          ) : visibleItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin liquidaciones.</p>
          ) : (
            <table className="data-table min-w-[900px]">
              <thead className="data-table__head data-table__head">
                <tr className="data-table__row data-table__row">
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Empleado</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Fecha</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Motivo</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Estado</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Indemniz.</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Total</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Acciones</th>
                </tr>
              </thead>
              <tbody className="data-table__body data-table__body">
                {visibleItems.map((row: TerminationRow) => (
                  <tr key={row.id} className="data-table__row data-table__row">
                    <td className="data-table__cell data-table__cell">{row.employeeName}</td>
                    <td className="data-table__cell data-table__cell">{row.terminationDate}</td>
                    <td className="data-table__cell data-table__cell">
                      {REASON_LABEL[row.reason] ?? row.reason}
                    </td>
                    <td className="data-table__cell data-table__cell">
                      {STATUS_LABEL[row.status] ?? row.status}
                    </td>
                    <td className="data-table__cell data-table__cell">
                      {formatMoney(row.indemnizacionAmount)}
                    </td>
                    <td className="font-medium data-table__cell data-table__cell">
                      {formatMoney(row.totalSettlement)}
                    </td>
                    <td className="data-table__cell data-table__cell">
                      <div className="flex flex-wrap gap-2">
                        {row.status === "EN_REVISION" ? (
                          <>
                            <Button
                              size="sm"
                              disabled={submitting}
                              onClick={() => openConfirmation("approve", row)}
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={submitting}
                              onClick={() => {
                                openConfirmation("void", row);
                              }}
                            >
                              Anular
                            </Button>
                          </>
                        ) : null}
                        {row.status === "APROBADA" ? (
                          <Button
                            size="sm"
                            disabled={submitting}
                            onClick={() => openConfirmation("pay", row)}
                          >
                            Pagar
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Nueva liquidación"
        description="Cálculo automático al crear"
        size="md"
      >
        <form className="grid gap-3" onSubmit={onCreate}>
          <label className="grid gap-1 text-sm">
            <span>Empleado *</span>
            <select
              required
              className="h-10 rounded-md border border-border px-3"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">{employeesError ? "Error al cargar" : "—"}</option>
              {employees
                .filter((e: EmployeeRow) => e.isActive)
                .map((e: EmployeeRow) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Fecha de baja *</span>
            <input
              type="date"
              required
              className="h-10 rounded-md border border-border px-3"
              value={terminationDate}
              onChange={(e) => setTerminationDate(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Motivo</span>
            <select
              className="h-10 rounded-md border border-border px-3"
              value={reason}
              onChange={(e) => setReason(e.target.value as TerminationReason)}
            >
              {TERMINATION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {REASON_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Salario pendiente</span>
            <input
              type="number"
              min={0}
              step="0.01"
              className="h-10 rounded-md border border-border px-3"
              value={pendingSalary}
              onChange={(e) => setPendingSalary(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Notas</span>
            <textarea
              className="min-h-[70px] rounded-md border border-border px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmation != null}
        title={
          confirmation?.action === "pay"
            ? "Pagar liquidación"
            : confirmation?.action === "void"
              ? "Anular liquidación"
              : "Aprobar liquidación"
        }
        description={
          confirmation
            ? confirmation.action === "pay"
              ? `¿Pagar la liquidación de ${confirmation.row.employeeName}? Se registrará el pago y no podrá modificarse.`
              : confirmation.action === "void"
                ? `¿Anular la liquidación de ${confirmation.row.employeeName}? Quedará anulada y no podrá pagarse.`
                : `¿Aprobar la liquidación de ${confirmation.row.employeeName}? El empleado se desactivará y el finiquito quedará listo para pago.`
            : "Confirma la acción seleccionada."
        }
        confirmLabel={
          confirmation?.action === "pay"
            ? "Pagar"
            : confirmation?.action === "void"
              ? "Anular"
              : "Aprobar"
        }
        destructive={confirmation?.action === "void"}
        loading={submitting}
        confirmDisabled={confirmation?.action === "void" && !voidReason.trim()}
        error={confirmationError}
        onConfirm={() => void confirmTransition()}
        onCancel={() => {
          if (!submitting) {
            setConfirmation(null);
            setConfirmationError(null);
            setVoidReason("");
          }
        }}
      >
        {confirmation?.action === "void" ? (
          <label className="grid gap-1 text-sm">
            <span>Motivo *</span>
            <textarea
              required
              aria-label="Motivo de anulación"
              className="min-h-[80px] rounded-md border border-border px-3 py-2"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
            />
          </label>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
