"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import type { PayrollRunRow, PayrollRunStatus } from "@/lib/api/payroll";
import { usePayrollPeriods, usePayrollRun, usePayrollRuns } from "@/hooks/use-payroll";

function formatMoney(value: string | number) {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("es-SV", { style: "currency", currency: "USD" });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("es-SV");
}

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
  ANULADA: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

export default function CorridasContent() {
  const [periodFilter, setPeriodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<PayrollRunStatus | "">("");
  const { items, loading, generateRun, approveRun, payRun, voidRun, submitting } = usePayrollRuns({
    periodId: periodFilter || undefined,
    status: statusFilter || undefined,
  });
  const { items: periods } = usePayrollPeriods({ isClosed: false });

  const [open, setOpen] = useState(false);
  const [periodId, setPeriodId] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const [detailId, setDetailId] = useState<string | null>(null);
  const { run: runDetail, loading: loadingDetail } = usePayrollRun(detailId);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Corridas de planilla</h1>
          <p className="text-sm text-muted-foreground">
            Flujo EN_REVISIÓN → APROBADA → PAGADA. AFP, ISSS e ISR se calculan por empleado activo.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          Generar corrida
        </Button>
      </div>

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
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin corridas.</p>
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Período</th>
                  <th className="pb-2 pr-3 font-medium">Nombre</th>
                  <th className="pb-2 pr-3 font-medium">Estado</th>
                  <th className="pb-2 pr-3 font-medium">Empleados</th>
                  <th className="pb-2 pr-3 font-medium">Bruto</th>
                  <th className="pb-2 pr-3 font-medium">Deducciones</th>
                  <th className="pb-2 pr-3 font-medium">Neto</th>
                  <th className="pb-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row: PayrollRunRow) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-3">{row.periodName}</td>
                    <td className="py-2.5 pr-3">
                      <button
                        type="button"
                        className="font-medium text-primary underline-offset-2 hover:underline"
                        onClick={() => setDetailId(row.id)}
                      >
                        {row.name}
                      </button>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status]}`}>
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">{row.employeeCount}</td>
                    <td className="py-2.5 pr-3">{formatMoney(row.totalGross)}</td>
                    <td className="py-2.5 pr-3">{formatMoney(row.totalDeductions)}</td>
                    <td className="py-2.5 pr-3 font-medium">{formatMoney(row.totalNet)}</td>
                    <td className="py-2.5">
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
        </CardContent>
      </Card>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Generar corrida</CardTitle>
              <CardDescription>
                Crea una línea por cada empleado activo del período (excluye pasantes)
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      ) : null}

      {detailId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
            <CardHeader>
              <CardTitle>{runDetail?.name ?? "Detalle de corrida"}</CardTitle>
              <CardDescription>
                {runDetail ? `${runDetail.periodName} — ${STATUS_LABEL[runDetail.status]}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="pb-2 pr-3 font-medium">Empleado</th>
                          <th className="pb-2 pr-3 font-medium">Puesto</th>
                          <th className="pb-2 pr-3 font-medium">Bruto</th>
                          <th className="pb-2 pr-3 font-medium">AFP</th>
                          <th className="pb-2 pr-3 font-medium">ISSS</th>
                          <th className="pb-2 pr-3 font-medium">ISR</th>
                          <th className="pb-2 font-medium">Neto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {runDetail.details.map((d) => (
                          <tr key={d.id} className="border-b border-border/60">
                            <td className="py-2 pr-3">{d.employeeName}</td>
                            <td className="py-2 pr-3">{d.positionName ?? "—"}</td>
                            <td className="py-2 pr-3">{formatMoney(d.totalGross)}</td>
                            <td className="py-2 pr-3">{formatMoney(d.afpEmployeeAmount)}</td>
                            <td className="py-2 pr-3">{formatMoney(d.isssEmployeeAmount)}</td>
                            <td className="py-2 pr-3">{formatMoney(d.isrAmount)}</td>
                            <td className="py-2 font-medium">{formatMoney(d.netPay)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => setDetailId(null)}>
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
