"use client";

/**
 * Periodos Payroll (PayrollPeriod): ventanas de cálculo; el cierre impide nuevas corridas.
 */

import { PageHeader } from "@/components/layout/page-header";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api";
import { PayrollPeriodConstraints } from "@/lib/constraints";
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

/** Administra los períodos de planilla y sus estados de cierre. */
export default function PeriodosContent() {
  const [statusFilter, setStatusFilter] = useState<"" | "abiertos" | "cerrados">("");
  const { items, loading, isError, error, refresh, createPeriod, updatePeriod, closePeriod, reopenPeriod, submitting } =
    usePayrollPeriods({
      isClosed: statusFilter === "" ? undefined : statusFilter === "cerrados",
    });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PayrollPeriodRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [toggleTarget, setToggleTarget] = useState<PayrollPeriodRow | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

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

  /** Abre la confirmación de cierre o reapertura del período seleccionado. */
  function openToggleConfirmation(row: PayrollPeriodRow) {
    setToggleTarget(row);
    setToggleError(null);
  }

  /** Ejecuta el cambio de estado y mantiene el diálogo abierto ante errores. */
  async function onToggleClose() {
    if (!toggleTarget) return;
    try {
      if (toggleTarget.isClosed) {
        await reopenPeriod(toggleTarget.id);
        toast.success("Período reabierto");
      } else {
        await closePeriod(toggleTarget.id);
        toast.success("Período cerrado");
      }
      setToggleTarget(null);
      setToggleError(null);
    } catch (err) {
      setToggleError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado del período");
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
          <FormField label="Estado del período" id="period-status-filter">
            <Select
              id="period-status-filter"
              name="periodStatus"
              className="sm:max-w-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "" | "abiertos" | "cerrados")}
            >
            <option value="">Todos los períodos</option>
            <option value="abiertos">Solo abiertos</option>
            <option value="cerrados">Solo cerrados</option>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listado ({items.length})</CardTitle>
          <CardDescription>Un período cerrado no admite nuevas corridas ni ediciones</CardDescription>
        </CardHeader>
        <CardContent className="table-container">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : isError ? (
            <QueryErrorState error={error} onRetry={() => void refresh()} />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin períodos.</p>
          ) : (
            <table className="data-table min-w-[820px]">
              <thead className="data-table__head data-table__head">
                <tr className="data-table__row data-table__row">
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Nombre</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Tipo</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Inicio</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Fin</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Pago</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Corridas</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Estado</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Acciones</th>
                </tr>
              </thead>
              <tbody className="data-table__body data-table__body">
                {items.map((row) => (
                  <tr key={row.id} className="data-table__row data-table__row">
                    <td className="font-medium data-table__cell data-table__cell">{row.name}</td>
                    <td className="data-table__cell data-table__cell">{PERIOD_TYPE_LABEL[row.periodType]}</td>
                    <td className="data-table__cell data-table__cell">{formatDate(row.startDate)}</td>
                    <td className="data-table__cell data-table__cell">{formatDate(row.endDate)}</td>
                    <td className="data-table__cell data-table__cell">{formatDate(row.paymentDate)}</td>
                    <td className="data-table__cell data-table__cell">{row.runsCount}</td>
                    <td className="data-table__cell data-table__cell">
                      <StatusBadge status={row.isClosed ? "CERRADO" : "ABIERTO"} />
                    </td>
                    <td className="data-table__cell data-table__cell">
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
                          onClick={() => openToggleConfirmation(row)}
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
        footer={
          <ModalFooter
            cancel={<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>}
            action={<Button type="submit" form="payroll-period-form" loading={submitting} loadingText="Guardando…">Guardar</Button>}
          />
        }
      >
        <form id="payroll-period-form" className="grid gap-3" onSubmit={onSubmit}>
          <FormField label="Nombre" name="name" required={PayrollPeriodConstraints.name.required} placeholder="Ej. Julio 2026 - 1ra quincena" constraints={PayrollPeriodConstraints.name}>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>
          <FormField label="Tipo" name="periodType" required={PayrollPeriodConstraints.periodType.required} placeholder="Selecciona una frecuencia" constraints={PayrollPeriodConstraints.periodType}>
            <Select
              value={form.periodType}
              onChange={(e) => setForm({ ...form, periodType: e.target.value as PayrollPeriodType })}
            >
              {Object.entries(PERIOD_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Inicio" name="startDate" required={PayrollPeriodConstraints.startDate.required} constraints={PayrollPeriodConstraints.startDate}>
              <Input
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </FormField>
            <FormField label="Fin" name="endDate" required={PayrollPeriodConstraints.endDate.required} constraints={PayrollPeriodConstraints.endDate}>
              <Input
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </FormField>
            <FormField label="Pago" name="paymentDate" required={PayrollPeriodConstraints.paymentDate.required} constraints={PayrollPeriodConstraints.paymentDate}>
              <Input
                value={form.paymentDate}
                onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              />
            </FormField>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={toggleTarget != null}
        title={toggleTarget?.isClosed ? "Reabrir período de planilla" : "Cerrar período de planilla"}
        description={
          toggleTarget
            ? toggleTarget.isClosed
              ? `¿Reabrir el período ${toggleTarget.name}? Volverá a admitir cambios y nuevas corridas.`
              : `¿Cerrar el período ${toggleTarget.name}? No admitirá nuevas corridas ni ediciones.`
            : "Confirma el cambio de estado del período."
        }
        confirmLabel={toggleTarget?.isClosed ? "Reabrir período" : "Cerrar período"}
        destructive={Boolean(toggleTarget && !toggleTarget.isClosed)}
        loading={submitting}
        error={toggleError}
        onConfirm={() => void onToggleClose()}
        onCancel={() => {
          if (!submitting) {
            setToggleTarget(null);
            setToggleError(null);
          }
        }}
      />
    </div>
  );
}
