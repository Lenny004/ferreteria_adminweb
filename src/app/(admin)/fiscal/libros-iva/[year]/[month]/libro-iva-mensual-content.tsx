/**
 * Libro IVA de un mes: tres reportes (CF, CCF, compras) y detalle de líneas por tipo.
 */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { fiscalApi, type IvaReportType } from "@/lib/api/fiscal";
import { formatMoney } from "@/lib/utils";
import { useIvaPeriod, useIvaReport } from "@/hooks/use-fiscal";
import { useState } from "react";

const TYPE_LABEL: Record<IvaReportType, string> = {
  VENTAS_CF: "Ventas CF",
  VENTAS_CCF: "Ventas CCF",
  COMPRAS: "Compras",
};

export default function LibroIvaMensualContent() {
  const params = useParams<{ year: string; month: string }>();
  const year = Number(params.year);
  const month = Number(params.month);
  const { data, loading, generate, close, submitting } = useIvaPeriod(year, month);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailQuery = useIvaReport(selectedId);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return <p className="text-sm text-muted-foreground">Periodo inválido</p>;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={`Libro IVA ${String(month).padStart(2, "0")}/${year}`}
        description="Detalle por tipo de libro"
        actions={
          <Button asChild variant="outline">
            <Link href="/fiscal/libros-iva">Volver</Link>
          </Button>
        }
      />

      {loading || !data ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <div className="grid gap-4">
          {data.previews.map((p) => (
            <Card key={p.reportType}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
                <CardTitle className="text-base">{TYPE_LABEL[p.reportType]}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={submitting || p.saved?.status === "CERRADO"}
                    onClick={async () => {
                      try {
                        await generate(p.reportType);
                        toast.success("Generado");
                      } catch (err) {
                        toast.error(err instanceof ApiError ? err.message : "Error");
                      }
                    }}
                  >
                    Generar
                  </Button>
                  {p.saved ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(p.saved!.id)}>
                        Ver líneas
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={p.saved.status === "CERRADO"}
                        onClick={async () => {
                          try {
                            await close(p.saved!.id);
                            toast.success("Cerrado");
                          } catch (err) {
                            toast.error(err instanceof ApiError ? err.message : "Error");
                          }
                        }}
                      >
                        Cerrar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await fiscalApi.exportExcel(p.saved!.id);
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Error");
                          }
                        }}
                      >
                        Excel
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Live: gravada {formatMoney(p.live.totalGravada)} · IVA{" "}
                {formatMoney(p.live.totalIva)} · {p.live.lineCount} docs
                {p.saved
                  ? ` · Guardado: ${p.saved.status}${p.balanced ? "" : " (descuadrado)"}`
                  : ""}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={selectedId != null}
        onOpenChange={(v) => {
          if (!v) setSelectedId(null);
        }}
        title="Líneas del libro"
        size="2xl"
      >
        <div className="space-y-3">
          {detailQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Doc</th>
                  <th>Tercero</th>
                  <th>Gravada</th>
                  <th>IVA</th>
                </tr>
              </thead>
              <tbody>
                {(detailQuery.data?.lines ?? []).map((l) => (
                  <tr key={l.sourceId}>
                    <td>{l.date}</td>
                    <td>{l.documentNumber}</td>
                    <td>{l.partnerName}</td>
                    <td>{formatMoney(l.totalGravada)}</td>
                    <td>{formatMoney(l.totalIva)}</td>
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
