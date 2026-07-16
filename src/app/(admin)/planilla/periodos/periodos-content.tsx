"use client";

import { PageHeader } from "@/components/layout/page-header";
/**
 * Periodos Payroll (PayrollPeriod): ventanas de cálculo; el cierre impide nuevas corridas.
 */
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { CreatePayrollPeriodInput, PayrollPeriodRow, PayrollPeriodType } from "@/lib/api/payroll";
import { usePayrollPeriods } from "@/hooks/use-payroll";

const PERIOD_TYPE_LABEL: Record<PayrollPeriodType, string> = {
  MENSUAL: "Mensual",
  QUINCENAL: "Quincenal",
  SEMANAL: "Semanal",
};

const emptyForm = {
  name: "",
  periodType: "MENSUAL" as PayrollPeriodType,
  startDate: "",
  endDate: "",
  paymentDate: "",
};

export default function PeriodosContent() {
  const [statusFilter, setStatusFilter] = useState<"" | "abiertos" | "cerrados">("");
  const { items, loading, createPeriod, updatePeriod, closePeriod, reopenPeriod, submitting } =
    usePayrollPeriods({
      isClosed: statusFilter === "" ? undefined : statusFilter === "cerrados",
    });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PayrollPeriodRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(row: PayrollPeriodRow) {
    setEditing(row);
    setForm({
      name: row.name,
      periodType: row.periodType,
      startDate: row.startDate,
      endDate: row.endDate,
      paymentDate: row.paymentDate,
    });
    setOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload: CreatePayrollPeriodInput = {
      name: form.name.trim(),
      periodType: form.periodType,
      startDate: form.startDate,
      endDate: form.endDate,
      paymentDate: form.paymentDate,
    };
    try {
      if (editing) {
        await updatePeriod(editing.id, payload);
        toast.success("Período actualizado");
      } else {
        await createPeriod(payload);
        toast.success("Período creado");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar");
    }
  }

  async function onToggleClose(row: PayrollPeriodRow) {
    try {
      if (row.isClosed) {
        await reopenPeriod(row.id);
        toast.success("Período reabierto");
      } else {
        await closePeriod(row.id);
        toast.success("Período cerrado");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Períodos de planilla"
        description="Ventanas de fechas (mensual, quincenal o semanal) para generar corridas de planilla."
        actions={<Button onClick={openCreate}>Nuevo período</Button>}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <select
            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "" | "abiertos" | "cerrados")}
          >
            <option value="">Todos los períodos</option>
            <option value="abiertos">Solo abiertos</option>
            <option value="cerrados">Solo cerrados</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listado ({items.length})</CardTitle>
          <CardDescription>Un período cerrado no admite nuevas corridas ni ediciones</CardDescription>
        </CardHeader>
        <CardContent className="data-table-wrap">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin períodos.</p>
          ) : (
            <table className="data-table min-w-[820px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Nombre</th>
                  <th className="pb-2 pr-3 font-medium">Tipo</th>
                  <th className="pb-2 pr-3 font-medium">Inicio</th>
                  <th className="pb-2 pr-3 font-medium">Fin</th>
                  <th className="pb-2 pr-3 font-medium">Pago</th>
                  <th className="pb-2 pr-3 font-medium">Corridas</th>
                  <th className="pb-2 pr-3 font-medium">Estado</th>
                  <th className="pb-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-3 font-medium">{row.name}</td>
                    <td className="py-2.5 pr-3">{PERIOD_TYPE_LABEL[row.periodType]}</td>
                    <td className="py-2.5 pr-3">{formatDate(row.startDate)}</td>
                    <td className="py-2.5 pr-3">{formatDate(row.endDate)}</td>
                    <td className="py-2.5 pr-3">{formatDate(row.paymentDate)}</td>
                    <td className="py-2.5 pr-3">{row.runsCount}</td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={
                          row.isClosed
                            ? "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                            : "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        }
                      >
                        {row.isClosed ? "Cerrado" : "Abierto"}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-2">
                        {!row.isClosed ? (
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                            Editar
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={submitting}
                          onClick={() => onToggleClose(row)}
                        >
                          {row.isClosed ? "Reabrir" : "Cerrar"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar período" : "Nuevo período"}
        description="Define la ventana de fechas para la corrida de planilla"
        size="lg"
      >
        <form className="grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1 text-sm">
            <span>Nombre *</span>
            <input
              required
              className="h-10 rounded-md border border-border px-3"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. Julio 2026 - 1ra quincena"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Tipo *</span>
            <select
              className="h-10 rounded-md border border-border px-3"
              value={form.periodType}
              onChange={(e) => setForm({ ...form, periodType: e.target.value as PayrollPeriodType })}
            >
              {Object.entries(PERIOD_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="grid gap-1 text-sm">
              <span>Inicio *</span>
              <input
                required
                type="date"
                className="h-10 rounded-md border border-border px-3"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Fin *</span>
              <input
                required
                type="date"
                className="h-10 rounded-md border border-border px-3"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Pago *</span>
              <input
                required
                type="date"
                className="h-10 rounded-md border border-border px-3"
                value={form.paymentDate}
                onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              />
            </label>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
