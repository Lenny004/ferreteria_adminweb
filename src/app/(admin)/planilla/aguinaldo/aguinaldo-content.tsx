"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import type {
  AguinaldoDetailRow,
  AguinaldoRunRow,
  AguinaldoRunStatus,
} from "@/lib/api/aguinaldo";
import { useAguinaldoRun, useAguinaldoRuns } from "@/hooks/use-aguinaldo";

function formatMoney(value: string | number) {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("es-SV", { style: "currency", currency: "USD" });
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-SV");
}

const STATUS_LABEL: Record<AguinaldoRunStatus, string> = {
  EN_REVISION: "En revisión",
  APROBADA: "Aprobada",
  PAGADA: "Pagada",
  ANULADA: "Anulada",
};

export default function AguinaldoContent() {
  const { items, loading, generate, approve, pay, voidRun, submitting } = useAguinaldoRuns();
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Aguinaldo</h1>
          <p className="text-sm text-muted-foreground">
            15/19/21 días según antigüedad × salario diario. ISR: exento hasta $600.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Generar corrida</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Corridas ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin corridas.</p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Año</th>
                  <th className="pb-2 pr-3 font-medium">Pago</th>
                  <th className="pb-2 pr-3 font-medium">Estado</th>
                  <th className="pb-2 pr-3 font-medium">Total</th>
                  <th className="pb-2 pr-3 font-medium">Empleados</th>
                  <th className="pb-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row: AguinaldoRunRow) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-3 font-medium">{row.year}</td>
                    <td className="py-2.5 pr-3">{formatDate(row.paymentDate)}</td>
                    <td className="py-2.5 pr-3">
                      {STATUS_LABEL[row.status as AguinaldoRunStatus] ?? row.status}
                    </td>
                    <td className="py-2.5 pr-3">{formatMoney(row.totalAmount)}</td>
                    <td className="py-2.5 pr-3">{row.detailsCount}</td>
                    <td className="py-2.5">
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
        </CardContent>
      </Card>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Generar aguinaldo</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={onGenerate}>
                <label className="grid gap-1 text-sm">
                  <span>Año</span>
                  <input
                    type="number"
                    required
                    className="h-10 rounded-md border border-border px-3"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Fecha de pago</span>
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
                    Cerrar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    Generar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {detailId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <CardHeader>
              <CardTitle>Detalle {detailQuery.data?.year}</CardTitle>
              <CardDescription>
                Total {formatMoney(detailQuery.data?.totalAmount ?? 0)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {detailQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando…</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="pb-2 pr-2 font-medium">Empleado</th>
                      <th className="pb-2 pr-2 font-medium">Años</th>
                      <th className="pb-2 pr-2 font-medium">Días</th>
                      <th className="pb-2 pr-2 font-medium">Bruto</th>
                      <th className="pb-2 pr-2 font-medium">ISR</th>
                      <th className="pb-2 font-medium">Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailQuery.data?.details ?? []).map((d: AguinaldoDetailRow) => (
                      <tr key={d.id} className="border-b border-border/60">
                        <td className="py-2 pr-2">{d.employeeName}</td>
                        <td className="py-2 pr-2">{d.yearsOfService}</td>
                        <td className="py-2 pr-2">{d.daysEntitled}</td>
                        <td className="py-2 pr-2">{formatMoney(d.grossAmount)}</td>
                        <td className="py-2 pr-2">{formatMoney(d.isrRetained)}</td>
                        <td className="py-2">{formatMoney(d.netAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setDetailId(null)}>
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
