"use client";

import { PageHeader } from "@/components/layout/page-header";
/**
 * Índice fiscal mensual: borradores CF/CCF/compras y cierre de libros IVA.
 * Ventas desde DTE; compras desde OC recibidas. Estado BORRADOR → CERRADO.
 */
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { fiscalApi, type IvaReportType } from "@/lib/api/fiscal";
import { formatMoney } from "@/lib/utils";
import { useDteList, useIvaPeriod } from "@/hooks/use-fiscal";

const TYPE_LABEL: Record<IvaReportType, string> = {
  VENTAS_CF: "Ventas CF (01)",
  VENTAS_CCF: "Ventas CCF (03)",
  COMPRAS: "Compras",
};

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function LibrosIvaContent() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { data, loading, generate, close, submitting } = useIvaPeriod(year, month);
  const dteQuery = useDteList(year, month);

  async function onGenerate(type: IvaReportType) {
    try {
      await generate(type);
      toast.success(`Borrador ${TYPE_LABEL[type]} generado`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo generar");
    }
  }

  async function onClose(id: string) {
    try {
      await close(id);
      toast.success("Libro cerrado");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cerrar");
    }
  }

  async function onExport(id: string) {
    try {
      await fiscalApi.exportExcel(id);
      toast.success("Descarga iniciada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo exportar");
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Libros IVA"
        description="Ventas CF/CCF desde DTE y compras desde OC recibidas. BORRADOR → CERRADO."
        actions={
          <div className="flex gap-2">
            <input
              type="number"
              className="h-10 w-24 rounded-md border border-border px-2 text-sm"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
            <select
              className="h-10 rounded-md border border-border px-2 text-sm"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <Button asChild variant="outline">
              <Link href={`/fiscal/libros-iva/${year}/${month}`}>Detalle mes</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {loading || !data ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : (
          data.previews.map((p) => (
            <Card key={p.reportType}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{TYPE_LABEL[p.reportType]}</CardTitle>
                <CardDescription>
                  {p.live.lineCount} líneas ·{" "}
                  {p.saved ? p.saved.status : "Sin generar"}
                  {p.saved && !p.balanced ? " · descuadrado" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Gravada</div>
                    <div className="font-medium">{formatMoney(p.live.totalGravada)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">IVA</div>
                    <div className="font-medium">{formatMoney(p.live.totalIva)}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={submitting || p.saved?.status === "CERRADO"}
                    onClick={() => onGenerate(p.reportType)}
                  >
                    {p.saved ? "Regenerar" : "Generar"}
                  </Button>
                  {p.saved ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={submitting || p.saved.status === "CERRADO"}
                        onClick={() => onClose(p.saved!.id)}
                      >
                        Cerrar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onExport(p.saved!.id)}
                      >
                        Excel
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            DTE del período ({dteQuery.data?.total ?? 0})
          </CardTitle>
          <CardDescription>Consulta sin exponer payload/certificados</CardDescription>
        </CardHeader>
        <CardContent className="data-table-wrap">
          {(dteQuery.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Sin DTE en el mes.</p>
          ) : (
            <table className="data-table min-w-[720px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Fecha</th>
                  <th className="pb-2 pr-3 font-medium">Tipo</th>
                  <th className="pb-2 pr-3 font-medium">Control</th>
                  <th className="pb-2 pr-3 font-medium">MH</th>
                  <th className="pb-2 pr-3 font-medium">Gravada</th>
                  <th className="pb-2 font-medium">IVA</th>
                </tr>
              </thead>
              <tbody>
                {(dteQuery.data?.items ?? []).map((d) => (
                  <tr key={d.id} className="border-b border-border/60">
                    <td className="py-2 pr-3">{d.issuedAt.slice(0, 10)}</td>
                    <td className="py-2 pr-3">{d.dteType}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{d.controlNumber}</td>
                    <td className="py-2 pr-3">{d.mhStatus}</td>
                    <td className="py-2 pr-3">{formatMoney(d.totalGravada)}</td>
                    <td className="py-2">{formatMoney(d.totalIva)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
