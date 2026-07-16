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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/utils";
import type { PayrollDetailRow, PayrollRunRow, PayrollRunStatus } from "@/lib/api/payroll";
import { usePayrollPeriods, usePayrollRun, usePayrollRuns, useUpdatePayrollDetail } from "@/hooks/use-payroll";

const STATUS_LABEL: Record<PayrollRunStatus, string> = {
  EN_REVISION: "En revisión",
  APROBADA: "Aprobada",
  PAGADA: "Pagada",
  ANULADA: "Anulada",
};

const STATUS_BADGE: Record<PayrollRunStatus, string> = {
  EN_REVISION: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  APROBADA: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  PAGADA: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  ANULADA: "bg-danger/15 font-medium text-danger",
};

export default function CorridasContent() {
  const [periodFilter, setPeriodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<PayrollRunStatus | "">("");
  const [page, setPage] = useState(0);
  const { items, total, pageSize, loading, generateRun, approveRun, payRun, voidRun, submitting } =
    usePayrollRuns(
      {
        periodId: periodFilter || undefined,
        status: statusFilter || undefined,
      },
      page,
    );
  const { items: periods } = usePayrollPeriods({ isClosed: false });

  const [open, setOpen] = useState(false);
  const [periodId, setPeriodId] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const [detailId, setDetailId] = useState<string | null>(null);
  const { run: runDetail, loading: loadingDetail } = usePayrollRun(detailId);
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

  async function onApprove(id: string) {
    try {
      await approveRun(id);
      toast.success("Corrida aprobada");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo aprobar");
    }
  }

  async function onPay(id: string) {
    try {
      await payRun(id);
      toast.success("Corrida marcada como pagada");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo marcar como pagada");
    }
  }

  async function onVoid(id: string) {
    try {
      await voidRun(id);
      toast.success("Corrida anulada");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo anular");
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
          <select
            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          >
            <option value="">Todos los períodos</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PayrollRunStatus | "")}
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listado ({items.length})</CardTitle>
          <CardDescription>Totales en USD; costo patronal incluye AFP, ISSS e INSAFORP</CardDescription>
        </CardHeader>
        <CardContent className="data-table-wrap">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin corridas.</p>
          ) : (
            <table className="data-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Empleados</th>
                  <th>Bruto</th>
                  <th>Deducciones</th>
                  <th>Neto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row: PayrollRunRow) => (
                  <tr key={row.id}>
                    <td>{row.periodName}</td>
                    <td>
                      <button
                        type="button"
                        className="font-medium text-primary underline-offset-2 hover:underline"
                        onClick={() => setDetailId(row.id)}
                      >
                        {row.name}
                      </button>
                    </td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status]}`}>
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>
                    <td>{row.employeeCount}</td>
                    <td>{formatMoney(row.totalGross)}</td>
                    <td>{formatMoney(row.totalDeductions)}</td>
                    <td className="font-medium">{formatMoney(row.totalNet)}</td>
                    <td>
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
                              onClick={() => onApprove(row.id)}
                            >
                              Aprobar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={submitting}
                              onClick={() => onVoid(row.id)}
                            >
                              Anular
                            </Button>
                          </>
                        ) : null}
                        {row.status === "APROBADA" ? (
                          <>
                            <Button type="button" size="sm" disabled={submitting} onClick={() => onPay(row.id)}>
                              Pagar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={submitting}
                              onClick={() => onVoid(row.id)}
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
      >
        <form className="grid gap-3" onSubmit={onGenerate}>
          <label className="grid gap-1 text-sm">
            <span>Período *</span>
            <select
              required
              className="h-10 rounded-md border border-border px-3"
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Nombre de la corrida</span>
            <input
              className="h-10 rounded-md border border-border px-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Por defecto: Planilla <período>"
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
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Generando…" : "Generar"}
            </Button>
          </div>
        </form>
      </Modal>

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
          {loadingDetail || !runDetail ? (
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
              <div className="data-table-wrap">
                <table className="data-table min-w-[720px]">
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>Puesto</th>
                      <th>Bruto</th>
                      <th>AFP</th>
                      <th>ISSS</th>
                      <th>ISR</th>
                      <th>Neto</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {runDetail.details.map((d) => (
                      <tr key={d.id}>
                        <td>{d.employeeName}</td>
                        <td>{d.positionName ?? "—"}</td>
                        <td>{formatMoney(d.totalGross)}</td>
                        <td>{formatMoney(d.afpEmployeeAmount)}</td>
                        <td>{formatMoney(d.isssEmployeeAmount)}</td>
                        <td>{formatMoney(d.isrAmount)}</td>
                        <td className="font-medium">{formatMoney(d.netPay)}</td>
                        <td>
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
      >
        <form className="grid gap-3" onSubmit={onSaveLine}>
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
            <label key={key} className="grid gap-1 text-sm">
              <span>{label}</span>
              <input
                type="number"
                min={0}
                step="any"
                className="h-10 rounded-md border border-border px-3"
                value={editForm[key]}
                onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
              />
            </label>
          ))}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditLine(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateDetailMut.isPending}>
              Recalcular
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
