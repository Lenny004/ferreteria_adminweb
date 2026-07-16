/**
 * Aguinaldo anual: corrida por año con ciclo EN_REVISIÓN → APROBADA → PAGADA (como PayrollRun).
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

export default function AguinaldoContent() {
  const [page, setPage] = useState(0);
  const { items, total, pageSize, loading, generate, approve, pay, voidRun, submitting } =
    useAguinaldoRuns(page);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [paymentDate, setPaymentDate] = useState(`${new Date().getFullYear()}-12-12`);
  const [notes, setNotes] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailQuery = useAguinaldoRun(detailId);

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
          <CardTitle className="text-base">Corridas ({total})</CardTitle>
        </CardHeader>
        <CardContent className="data-table-wrap">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin corridas.</p>
          ) : (
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Año</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Empleados</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row: AguinaldoRunRow) => (
                  <tr key={row.id}>
                    <td className="font-medium">{row.year}</td>
                    <td>{formatDate(row.paymentDate)}</td>
                    <td>
                      {STATUS_LABEL[row.status as AguinaldoRunStatus] ?? row.status}
                    </td>
                    <td>{formatMoney(row.totalAmount)}</td>
                    <td>{row.detailsCount}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setDetailId(row.id)}>
                          Ver
                        </Button>
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
                              onClick={async () => {
                                try {
                                  await voidRun(row.id);
                                  toast.success("Anulada");
                                } catch (err) {
                                  toast.error(
                                    err instanceof ApiError ? err.message : "Error",
                                  );
                                }
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
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Años</th>
                  <th>Días</th>
                  <th>Bruto</th>
                  <th>ISR</th>
                  <th>Neto</th>
                </tr>
              </thead>
              <tbody>
                {(detailQuery.data?.details ?? []).map((d: AguinaldoDetailRow) => (
                  <tr key={d.id}>
                    <td>{d.employeeName}</td>
                    <td>{d.yearsOfService}</td>
                    <td>{d.daysEntitled}</td>
                    <td>{formatMoney(d.grossAmount)}</td>
                    <td>{formatMoney(d.isrRetained)}</td>
                    <td>{formatMoney(d.netAmount)}</td>
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
