/**
 * Aguinaldo anual: corrida por año con ciclo EN_REVISIÓN → APROBADA → PAGADA (como PayrollRun).
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
import { formatDate, formatMoney } from "@/lib/utils";
import type {
  AguinaldoDetailRow,
  AguinaldoRunRow,
  AguinaldoRunStatus,
} from "@/lib/api/aguinaldo";
import { useAguinaldoRun, useAguinaldoRuns } from "@/hooks/use-aguinaldo";

const STATUS_LABEL: Record<AguinaldoRunStatus, string> = {
  EN_REVISION: "En revisión",
  APROBADA: "Aprobada",
  PAGADA: "Pagada",
  ANULADA: "Anulada",
};

type AguinaldoConfirmation = {
  action: "approve" | "pay" | "void";
  row: AguinaldoRunRow;
};

/** Gestiona corridas de aguinaldo y consulta su detalle. */
export default function AguinaldoContent() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<AguinaldoRunStatus | "">("");
  const [yearFilter, setYearFilter] = useState("");
  const [openRunsOnly, setOpenRunsOnly] = useState(false);
  const { items, total, pageSize, loading, isError, error, refresh, generate, approve, pay, voidRun, submitting } =
    useAguinaldoRuns(page);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [paymentDate, setPaymentDate] = useState(`${new Date().getFullYear()}-12-12`);
  const [notes, setNotes] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailQuery = useAguinaldoRun(detailId);
  const [confirmation, setConfirmation] = useState<AguinaldoConfirmation | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  /** Abre la confirmación de una transición de la corrida de aguinaldo. */
  function openConfirmation(action: AguinaldoConfirmation["action"], row: AguinaldoRunRow) {
    setConfirmation({ action, row });
    setConfirmationError(null);
  }

  /** Ejecuta la transición confirmada y conserva el diálogo para reintentar ante un error. */
  async function confirmTransition() {
    if (!confirmation) return;
    try {
      if (confirmation.action === "approve") {
        await approve(confirmation.row.id);
        toast.success("Corrida de aguinaldo aprobada");
      } else if (confirmation.action === "pay") {
        await pay(confirmation.row.id);
        toast.success("Corrida de aguinaldo pagada");
      } else {
        await voidRun(confirmation.row.id);
        toast.success("Corrida de aguinaldo anulada");
      }
      setConfirmation(null);
      setConfirmationError(null);
    } catch (err) {
      setConfirmationError(err instanceof ApiError ? err.message : "No se pudo actualizar la corrida");
    }
  }

  const visibleItems = items.filter((row) => {
    if (openRunsOnly && row.status !== "EN_REVISION" && row.status !== "APROBADA") return false;
    if (!openRunsOnly && statusFilter && row.status !== statusFilter) return false;
    if (yearFilter && String(row.year) !== yearFilter) return false;
    return true;
  });

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    try {
      await generate({
        year: Number(year),
        paymentDate,
        notes: notes.trim() || undefined,
      });
      toast.success("Corrida de aguinaldo generada");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo generar");
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Aguinaldo"
        description="15/19/21 días según antigüedad × salario diario. ISR: exento hasta $600."
        actions={<Button onClick={() => setOpen(true)}>Generar corrida</Button>}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Año</span>
              <input
                type="number"
                className="h-10 rounded-md border border-border px-3 text-sm"
                placeholder="Ej. 2026"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Estado</span>
              <select
                className="h-10 rounded-md border border-border px-3 text-sm"
                value={statusFilter}
                disabled={openRunsOnly}
                onChange={(e) =>
                  setStatusFilter(e.target.value as AguinaldoRunStatus | "")
                }
              >
                <option value="">Todos</option>
                {(Object.keys(STATUS_LABEL) as AguinaldoRunStatus[]).map((k) => (
                  <option key={k} value={k}>
                    {STATUS_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <input
                type="checkbox"
                checked={openRunsOnly}
                onChange={(e) => {
                  setOpenRunsOnly(e.target.checked);
                  if (e.target.checked) setStatusFilter("");
                }}
              />
              Solo abiertas (revisión/aprobada)
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Corridas ({statusFilter || yearFilter || openRunsOnly ? visibleItems.length : total})
          </CardTitle>
        </CardHeader>
        <CardContent className="table-container">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : isError ? (
            <QueryErrorState error={error} onRetry={() => void refresh()} />
          ) : visibleItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin corridas.</p>
          ) : (
            <table className="data-table min-w-[720px]">
              <thead className="data-table__head data-table__head">
                <tr className="data-table__row data-table__row">
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Año</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Pago</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Estado</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Total</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Empleados</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Acciones</th>
                </tr>
              </thead>
              <tbody className="data-table__body data-table__body">
                {visibleItems.map((row: AguinaldoRunRow) => (
                  <tr key={row.id} className="data-table__row data-table__row">
                    <td className="font-medium data-table__cell data-table__cell">{row.year}</td>
                    <td className="data-table__cell data-table__cell">{formatDate(row.paymentDate)}</td>
                    <td className="data-table__cell data-table__cell">
                      {STATUS_LABEL[row.status as AguinaldoRunStatus] ?? row.status}
                    </td>
                    <td className="data-table__cell data-table__cell">{formatMoney(row.totalAmount)}</td>
                    <td className="data-table__cell data-table__cell">{row.detailsCount}</td>
                    <td className="data-table__cell data-table__cell">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setDetailId(row.id)}>
                          Ver
                        </Button>
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
                              onClick={() => openConfirmation("void", row)}
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

      <Modal open={open} onOpenChange={setOpen} title="Generar aguinaldo" size="md">
        <form className="grid gap-3" onSubmit={onGenerate}>
          <label className="grid gap-1 text-sm">
            <span>Año *</span>
            <input
              type="number"
              required
              className="h-10 rounded-md border border-border px-3"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Fecha de pago *</span>
            <input
              type="date"
              required
              className="h-10 rounded-md border border-border px-3"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
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
              Generar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmation != null}
        title={
          confirmation?.action === "pay"
            ? "Pagar aguinaldo"
            : confirmation?.action === "void"
              ? "Anular aguinaldo"
              : "Aprobar aguinaldo"
        }
        description={
          confirmation
            ? confirmation.action === "pay"
              ? `¿Pagar la corrida de aguinaldo de ${confirmation.row.year}? Se registrará el pago y no podrá modificarse.`
              : confirmation.action === "void"
                ? `¿Anular la corrida de aguinaldo de ${confirmation.row.year}? Quedará anulada y no podrá pagarse.`
                : `¿Aprobar la corrida de aguinaldo de ${confirmation.row.year}? Se bloquearán sus importes antes del pago.`
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
        title={`Detalle ${detailQuery.data?.year ?? ""}`}
        description={`Total ${formatMoney(detailQuery.data?.totalAmount ?? 0)}`}
        size="xl"
      >
        <div className="space-y-3">
          {detailQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : detailQuery.isError ? (
            <QueryErrorState error={detailQuery.error} onRetry={() => void detailQuery.refetch()} />
          ) : (
            <table className="data-table">
              <thead className="data-table__head data-table__head">
                <tr className="data-table__row data-table__row">
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Empleado</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Años</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Días</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Bruto</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">ISR</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Neto</th>
                </tr>
              </thead>
              <tbody className="data-table__body data-table__body">
                {(detailQuery.data?.details ?? []).map((d: AguinaldoDetailRow) => (
                  <tr key={d.id} className="data-table__row data-table__row">
                    <td className="data-table__cell data-table__cell">{d.employeeName}</td>
                    <td className="data-table__cell data-table__cell">{d.yearsOfService}</td>
                    <td className="data-table__cell data-table__cell">{d.daysEntitled}</td>
                    <td className="data-table__cell data-table__cell">{formatMoney(d.grossAmount)}</td>
                    <td className="data-table__cell data-table__cell">{formatMoney(d.isrRetained)}</td>
                    <td className="data-table__cell data-table__cell">{formatMoney(d.netAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
}
