/**
 * Corridas de planilla (PayrollRun): listado, generación y ciclo de vida.
 * Ajuste de líneas (horas extra, bonos, deducciones) solo en EN_REVISIÓN; flujo hasta PAGADA.
 */
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { PayrollDetailConstraints, PayrollRunConstraints } from "@/lib/constraints";
import { formatDateTime, formatMoney } from "@/lib/utils";
import type { PayrollDetailRow, PayrollRunRow, PayrollRunStatus } from "@/lib/api/payroll";
import { usePayrollPeriods, usePayrollRun, usePayrollRuns, useUpdatePayrollDetail } from "@/hooks/use-payroll";

const STATUS_LABEL: Record<PayrollRunStatus, string> = {
  EN_REVISION: "En revisión",
  APROBADA: "Aprobada",
  PAGADA: "Pagada",
  ANULADA: "Anulada",
};

const RUN_STATUSES: PayrollRunStatus[] = ["EN_REVISION", "APROBADA", "PAGADA", "ANULADA"];

type PayrollRunConfirmation = {
  action: "approve" | "pay" | "void";
  row: PayrollRunRow;
};

/** Gestiona corridas de planilla, su workflow y el detalle editable. */
export default function CorridasContent() {
  const [periodFilter, setPeriodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<PayrollRunStatus | "">("");
  const [page, setPage] = useState(0);
  const { items, total, pageSize, loading, isError, error, refresh, generateRun, approveRun, payRun, voidRun, submitting } =
    usePayrollRuns(
      {
        periodId: periodFilter || undefined,
        status: statusFilter || undefined,
      },
      page,
    );
  const { items: periods, isError: periodsError } = usePayrollPeriods({ isClosed: false });

  const [open, setOpen] = useState(false);
  const [periodId, setPeriodId] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmation, setConfirmation] = useState<PayrollRunConfirmation | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  const [detailId, setDetailId] = useState<string | null>(null);
  const { run: runDetail, loading: loadingDetail, isError: detailError, error: detailQueryError, refresh: refreshDetail } = usePayrollRun(detailId);
  const updateDetailMut = useUpdatePayrollDetail();
  const [editLine, setEditLine] = useState<PayrollDetailRow | null>(null);
  const [editForm, setEditForm] = useState({
    overtimeHoursDiurnal: "0",
    overtimeHoursNocturnal: "0",
    overtimeHoursHoliday: "0",
    bonuses: "0",
    viaticos: "0",
    loanDeduction: "0",
    otherDeductions: "0",
  });

  function openEditLine(d: PayrollDetailRow) {
    setEditLine(d);
    setEditForm({
      overtimeHoursDiurnal: String(d.overtimeHoursDiurnal ?? 0),
      overtimeHoursNocturnal: String(d.overtimeHoursNocturnal ?? 0),
      overtimeHoursHoliday: String(d.overtimeHoursHoliday ?? 0),
      bonuses: String(d.bonuses ?? 0),
      viaticos: String(d.viaticos ?? 0),
      loanDeduction: String(d.loanDeduction ?? 0),
      otherDeductions: String(d.otherDeductions ?? 0),
    });
  }

  async function onSaveLine(event: FormEvent) {
    event.preventDefault();
    if (!editLine) return;
    try {
      await updateDetailMut.mutateAsync({
        id: editLine.id,
        data: {
          overtimeHoursDiurnal: Number(editForm.overtimeHoursDiurnal) || 0,
          overtimeHoursNocturnal: Number(editForm.overtimeHoursNocturnal) || 0,
          overtimeHoursHoliday: Number(editForm.overtimeHoursHoliday) || 0,
          bonuses: Number(editForm.bonuses) || 0,
          viaticos: Number(editForm.viaticos) || 0,
          loanDeduction: Number(editForm.loanDeduction) || 0,
          otherDeductions: Number(editForm.otherDeductions) || 0,
        },
      });
      toast.success("Línea recalculada");
      setEditLine(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar");
    }
  }

  function resetForm() {
    setPeriodId("");
    setName("");
    setNotes("");
  }

  async function onGenerate(event: FormEvent) {
    event.preventDefault();
    if (!periodId) {
      toast.error("Selecciona un período");
      return;
    }
    try {
      await generateRun({ periodId, name: name.trim() || undefined, notes: notes.trim() || undefined });
      toast.success("Corrida generada en revisión");
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo generar la corrida");
    }
  }

  /** Abre la confirmación de una transición de estado de una corrida. */
  function openConfirmation(action: PayrollRunConfirmation["action"], row: PayrollRunRow) {
    setConfirmation({ action, row });
    setConfirmationError(null);
  }

  /** Ejecuta la transición confirmada y conserva el diálogo abierto si la API falla. */
  async function confirmTransition() {
    if (!confirmation) return;
    try {
      if (confirmation.action === "approve") {
        await approveRun(confirmation.row.id);
        toast.success("Corrida aprobada");
      } else if (confirmation.action === "pay") {
        await payRun(confirmation.row.id);
        toast.success("Corrida marcada como pagada");
      } else {
        await voidRun(confirmation.row.id);
        toast.success("Corrida anulada");
      }
      setConfirmation(null);
      setConfirmationError(null);
    } catch (err) {
      setConfirmationError(
        err instanceof ApiError ? err.message : "No se pudo actualizar la corrida",
      );
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Corridas de planilla"
        description="Flujo EN_REVISIÓN → APROBADA → PAGADA. AFP, ISSS e ISR se calculan por empleado activo."
        actions={
          <Button
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
          >
            Generar corrida
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <FormField label="Período" id="payroll-run-period-filter">
            <Select
              id="payroll-run-period-filter"
              name="periodId"
              className="sm:max-w-xs"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          >
            <option value="">{periodsError ? "Error al cargar" : "Todos los períodos"}</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            </Select>
          </FormField>
          <FormField label="Estado" id="payroll-run-status-filter">
            <Select
              id="payroll-run-status-filter"
              name="status"
              className="sm:max-w-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PayrollRunStatus | "")}
          >
            <option value="">Todos los estados</option>
            {RUN_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listado ({items.length})</CardTitle>
          <CardDescription>Totales en USD; costo patronal incluye AFP, ISSS e INSAFORP</CardDescription>
        </CardHeader>
        <CardContent className="table-container">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : isError ? (
            <QueryErrorState error={error} onRetry={() => void refresh()} />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin corridas.</p>
          ) : (
            <table className="data-table min-w-[900px]">
              <thead className="data-table__head data-table__head">
                <tr className="data-table__row data-table__row">
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Período</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Nombre</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Estado</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Empleados</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Bruto</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Deducciones</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Neto</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Acciones</th>
                </tr>
              </thead>
              <tbody className="data-table__body data-table__body">
                {items.map((row: PayrollRunRow) => (
                  <tr key={row.id} className="data-table__row data-table__row">
                    <td className="data-table__cell data-table__cell">{row.periodName}</td>
                    <td className="data-table__cell data-table__cell">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium text-primary underline-offset-2 hover:underline"
                        onClick={() => setDetailId(row.id)}
                      >
                        {row.name}
                      </Button>
                    </td>
                    <td className="data-table__cell data-table__cell">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="data-table__cell data-table__cell">{row.employeeCount}</td>
                    <td className="data-table__cell data-table__cell">{formatMoney(row.totalGross)}</td>
                    <td className="data-table__cell data-table__cell">{formatMoney(row.totalDeductions)}</td>
                    <td className="font-medium data-table__cell data-table__cell">{formatMoney(row.totalNet)}</td>
                    <td className="data-table__cell data-table__cell">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" asChild>
                          <Link href={`/planilla/corridas/${row.id}/export`}>Exportar</Link>
                        </Button>
                        {row.status === "EN_REVISION" ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              disabled={submitting}
                              onClick={() => openConfirmation("approve", row)}
                            >
                              Aprobar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={submitting}
                              onClick={() => openConfirmation("void", row)}
                            >
                              Anular
                            </Button>
                          </>
                        ) : null}
                        {row.status === "APROBADA" ? (
                          <>
                            <Button type="button" size="sm" disabled={submitting} onClick={() => openConfirmation("pay", row)}>
                              Pagar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={submitting}
                                onClick={() => openConfirmation("void", row)}
                            >
                              Anular
                            </Button>
                          </>
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
        title="Generar corrida"
        description="Crea una línea por cada empleado activo del período (excluye pasantes)"
        size="lg"
        footer={
          <ModalFooter
            cancel={<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>}
            action={<Button type="submit" form="payroll-run-form" loading={submitting} loadingText="Generando…">Generar</Button>}
          />
        }
      >
        <form id="payroll-run-form" className="grid gap-3" onSubmit={onGenerate}>
          <FormField label="Período" name="periodId" required={PayrollRunConstraints.periodId.required} placeholder="Selecciona un período" constraints={PayrollRunConstraints.periodId}>
            <Select
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
            >
              <option value="">{periodsError ? "Error al cargar" : "Seleccionar…"}</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Nombre de la corrida" name="name" placeholder="Por defecto: Planilla del período" constraints={PayrollRunConstraints.name}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <FormField label="Notas" name="notes" placeholder="Observaciones opcionales" constraints={PayrollRunConstraints.notes}>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmation != null}
        title={
          confirmation?.action === "pay"
            ? "Pagar corrida de planilla"
            : confirmation?.action === "void"
              ? "Anular corrida de planilla"
              : "Aprobar corrida de planilla"
        }
        description={
          confirmation
            ? confirmation.action === "pay"
              ? `¿Pagar la corrida ${confirmation.row.name} del período ${confirmation.row.periodName}? Se registrará el pago y no podrá modificarse.`
              : confirmation.action === "void"
                ? `¿Anular la corrida ${confirmation.row.name} del período ${confirmation.row.periodName}? Quedará anulada y no podrá pagarse.`
                : `¿Aprobar la corrida ${confirmation.row.name} del período ${confirmation.row.periodName}? Se bloquearán los cambios de sus importes antes del pago.`
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
        error={confirmationError}
        onConfirm={() => void confirmTransition()}
        onCancel={() => {
          if (!submitting) {
            setConfirmation(null);
            setConfirmationError(null);
          }
        }}
      />

      <Modal
        open={detailId != null}
        onOpenChange={(v) => {
          if (!v) setDetailId(null);
        }}
        title={runDetail?.name ?? "Detalle de corrida"}
        description={runDetail ? `${runDetail.periodName} — ${STATUS_LABEL[runDetail.status]}` : undefined}
        size="2xl"
      >
        <div className="space-y-4">
          {detailError ? (
            <QueryErrorState error={detailQueryError} onRetry={() => void refreshDetail()} />
          ) : loadingDetail || !runDetail ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-md border border-border p-3">
                  <div className="text-xs text-muted-foreground">Bruto</div>
                  <div className="text-lg font-semibold">{formatMoney(runDetail.totalGross)}</div>
                </div>
                <div className="rounded-md border border-border p-3">
                  <div className="text-xs text-muted-foreground">Deducciones</div>
                  <div className="text-lg font-semibold">{formatMoney(runDetail.totalDeductions)}</div>
                </div>
                <div className="rounded-md border border-border p-3">
                  <div className="text-xs text-muted-foreground">Neto</div>
                  <div className="text-lg font-semibold">{formatMoney(runDetail.totalNet)}</div>
                </div>
                <div className="rounded-md border border-border p-3">
                  <div className="text-xs text-muted-foreground">Costo patronal</div>
                  <div className="text-lg font-semibold">{formatMoney(runDetail.totalPatronal)}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Aprobada: {formatDateTime(runDetail.approvedAt)} · Pagada:{" "}
                {formatDateTime(runDetail.paidAt)}
              </p>
              <div className="table-container">
                <table className="data-table min-w-[720px]">
                  <thead className="data-table__head data-table__head">
                    <tr className="data-table__row data-table__row">
                      <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Empleado</th>
                      <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Puesto</th>
                      <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Bruto</th>
                      <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">AFP</th>
                      <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">ISSS</th>
                      <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">ISR</th>
                      <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Neto</th>
                      <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading" />
                    </tr>
                  </thead>
                  <tbody className="data-table__body data-table__body">
                    {runDetail.details.map((d) => (
                      <tr key={d.id} className="data-table__row data-table__row">
                        <td className="data-table__cell data-table__cell">{d.employeeName}</td>
                        <td className="data-table__cell data-table__cell">{d.positionName ?? "—"}</td>
                        <td className="data-table__cell data-table__cell">{formatMoney(d.totalGross)}</td>
                        <td className="data-table__cell data-table__cell">{formatMoney(d.afpEmployeeAmount)}</td>
                        <td className="data-table__cell data-table__cell">{formatMoney(d.isssEmployeeAmount)}</td>
                        <td className="data-table__cell data-table__cell">{formatMoney(d.isrAmount)}</td>
                        <td className="font-medium data-table__cell data-table__cell">{formatMoney(d.netPay)}</td>
                        <td className="data-table__cell data-table__cell">
                          {runDetail.status === "EN_REVISION" ||
                          runDetail.status === "APROBADA" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openEditLine(d)}
                            >
                              Editar
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={editLine != null}
        onOpenChange={(v) => {
          if (!v) setEditLine(null);
        }}
        title={`Editar línea — ${editLine?.employeeName ?? ""}`}
        description="Extras, bonos y deducciones; se recalcula AFP/ISSS/ISR"
        size="md"
        footer={
          <ModalFooter
            cancel={<Button type="button" variant="outline" onClick={() => setEditLine(null)}>Cancelar</Button>}
            action={<Button type="submit" form="payroll-detail-form" loading={updateDetailMut.isPending} loadingText="Recalculando…">Recalcular</Button>}
          />
        }
      >
        <form id="payroll-detail-form" className="grid gap-3" onSubmit={onSaveLine}>
          {(
            [
              ["overtimeHoursDiurnal", "HE diurnas"],
              ["overtimeHoursNocturnal", "HE nocturnas"],
              ["overtimeHoursHoliday", "HE feriado"],
              ["bonuses", "Bonos"],
              ["viaticos", "Viáticos"],
              ["loanDeduction", "Préstamo"],
              ["otherDeductions", "Otras deducciones"],
            ] as const
          ).map(([key, label]) => (
            <FormField key={key} label={label} name={key} placeholder="0" constraints={PayrollDetailConstraints[key]}>
              <Input
                value={editForm[key]}
                onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
              />
            </FormField>
          ))}
        </form>
      </Modal>
    </div>
  );
}
