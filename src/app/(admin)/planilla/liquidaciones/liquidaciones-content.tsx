/**
 * Finiquitos/liquidaciones: cálculo por motivo de salida y flujo EN_REVISIÓN → APROBADA → PAGADA.
 */
"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
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
    create,
    approve,
    pay,
    voidTermination,
    submitting,
  } = useTerminations(page);
  const [open, setOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<TerminationRow | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [terminationDate, setTerminationDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [reason, setReason] = useState<TerminationReason>("RENUNCIA_VOLUNTARIA");
  const [pendingSalary, setPendingSalary] = useState("0");
  const [notes, setNotes] = useState("");

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
        <CardContent className="data-table-wrap">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : visibleItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin liquidaciones.</p>
          ) : (
            <table className="data-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Fecha</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Indemniz.</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((row: TerminationRow) => (
                  <tr key={row.id}>
                    <td>{row.employeeName}</td>
                    <td>{row.terminationDate}</td>
                    <td>
                      {REASON_LABEL[row.reason] ?? row.reason}
                    </td>
                    <td>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </td>
                    <td>
                      {formatMoney(row.indemnizacionAmount)}
                    </td>
                    <td className="font-medium">
                      {formatMoney(row.totalSettlement)}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {row.status === "EN_REVISION" ? (
                          <>
                            <Button
                              size="sm"
                              disabled={submitting}
                              onClick={async () => {
                                try {
                                  await approve(row.id);
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
                              onClick={() => {
                                setVoidTarget(row);
                                setVoidReason("");
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
                            onClick={async () => {
                              try {
                                await pay(row.id);
                                toast.success("Pagada");
                              } catch (err) {
                                toast.error(
                                  err instanceof ApiError ? err.message : "Error",
                                );
                              }
                            }}
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
              <option value="">—</option>
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

      <Modal
        open={voidTarget != null}
        onOpenChange={(o) => {
          if (!o) setVoidTarget(null);
        }}
        title="Anular liquidación"
        description="Indica el motivo de anulación"
        size="md"
      >
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!voidTarget || !voidReason.trim()) return;
            try {
              await voidTermination({ id: voidTarget.id, reason: voidReason.trim() });
              toast.success("Anulada");
              setVoidTarget(null);
              setVoidReason("");
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : "Error");
            }
          }}
        >
          <label className="grid gap-1 text-sm">
            <span>Motivo *</span>
            <textarea
              required
              className="min-h-[80px] rounded-md border border-border px-3 py-2"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setVoidTarget(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              Confirmar anulación
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
