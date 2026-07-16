/**
 * Finiquitos/liquidaciones: cálculo por motivo de salida y flujo EN_REVISIÓN → APROBADA → PAGADA.
 */
"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Liquidaciones</h1>
          <p className="text-sm text-muted-foreground">
            Finiquitos SV. Indemnización solo en despido injustificado. Empleado se
            desactiva al aprobar.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Nueva liquidación</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listado ({total})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin liquidaciones.</p>
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Empleado</th>
                  <th className="pb-2 pr-3 font-medium">Fecha</th>
                  <th className="pb-2 pr-3 font-medium">Motivo</th>
                  <th className="pb-2 pr-3 font-medium">Estado</th>
                  <th className="pb-2 pr-3 font-medium">Indemniz.</th>
                  <th className="pb-2 pr-3 font-medium">Total</th>
                  <th className="pb-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row: TerminationRow) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-3">{row.employeeName}</td>
                    <td className="py-2.5 pr-3">{row.terminationDate}</td>
                    <td className="py-2.5 pr-3">
                      {REASON_LABEL[row.reason] ?? row.reason}
                    </td>
                    <td className="py-2.5 pr-3">
                      {STATUS_LABEL[row.status] ?? row.status}
                    </td>
                    <td className="py-2.5 pr-3">
                      {formatMoney(row.indemnizacionAmount)}
                    </td>
                    <td className="py-2.5 pr-3 font-medium">
                      {formatMoney(row.totalSettlement)}
                    </td>
                    <td className="py-2.5">
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
