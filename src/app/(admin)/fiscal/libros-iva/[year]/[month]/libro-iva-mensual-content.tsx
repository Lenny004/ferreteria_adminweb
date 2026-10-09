/**
 * Libro IVA de un mes: tres reportes (CF, CCF, compras) y detalle de líneas por tipo.
 */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api";
import { fiscalApi, type IvaReportType } from "@/lib/api/fiscal";
import { formatDate, formatMoney } from "@/lib/utils";
import { useIvaPeriod, useIvaReport } from "@/hooks/use-fiscal";
import { useState } from "react";

const TYPE_LABEL: Record<IvaReportType, string> = {
  VENTAS_CF: "Ventas CF",
  VENTAS_CCF: "Ventas CCF",
  COMPRAS: "Compras",
};

/** Muestra el resumen y el detalle de un período mensual de IVA. */
export default function LibroIvaMensualContent() {
  const params = useParams<{ year: string; month: string }>();
  const year = Number(params.year);
  const month = Number(params.month);
  const { data, loading, isError, error, refetch, generate, close, submitting } = useIvaPeriod(year, month);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailQuery = useIvaReport(selectedId);
  const [closeTarget, setCloseTarget] = useState<{ id: string; label: string } | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [generateTarget, setGenerateTarget] = useState<{ reportType: IvaReportType; label: string } | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  /** Cierra el libro mensual confirmado y deja el error disponible para reintentar. */
  async function confirmClose() {
    if (!closeTarget) return;
    try {
      await close(closeTarget.id);
      toast.success("Libro cerrado");
      setCloseTarget(null);
      setCloseError(null);
    } catch (err) {
      setCloseError(err instanceof ApiError ? err.message : "No se pudo cerrar el libro IVA");
    }
  }

  /** Genera el reporte seleccionado y conserva el error para reintentar desde el diálogo. */
  async function generateReport(reportType: IvaReportType) {
    try {
      await generate(reportType);
      toast.success("Generado");
      setGenerateTarget(null);
      setGenerateError(null);
    } catch (err) {
      setGenerateError(err instanceof ApiError ? err.message : "No se pudo generar el libro IVA");
    }
  }

  /** Pide confirmación únicamente cuando la generación reemplazará un borrador existente. */
  function requestGenerate(reportType: IvaReportType, hasDraft: boolean) {
    setGenerateError(null);
    if (hasDraft) {
      setGenerateTarget({ reportType, label: TYPE_LABEL[reportType] });
      return;
    }
    void generateReport(reportType);
  }

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

      {isError ? (
        <QueryErrorState error={error} onRetry={() => void refetch()} />
      ) : loading || !data ? (
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
                    onClick={() => requestGenerate(p.reportType, p.saved?.status === "BORRADOR")}
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
                        onClick={() => {
                          setCloseTarget({ id: p.saved!.id, label: TYPE_LABEL[p.reportType] });
                          setCloseError(null);
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
                  ? <><span> · Guardado: </span><StatusBadge status={p.saved.status} />{p.balanced ? null : " (descuadrado)"}</>
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
          ) : detailQuery.isError ? (
            <QueryErrorState error={detailQuery.error} onRetry={() => void detailQuery.refetch()} />
          ) : (
            <div className="table-container">
            <table className="data-table min-w-[720px]">
              <thead className="data-table__head data-table__head">
                <tr className="data-table__row data-table__row">
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Fecha</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Doc</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Tercero</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Gravada</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">IVA</th>
                </tr>
              </thead>
              <tbody className="data-table__body data-table__body">
                {(detailQuery.data?.lines ?? []).map((l) => (
                  <tr key={l.sourceId} className="data-table__row data-table__row">
                    <td className="data-table__cell data-table__cell">{formatDate(l.date)}</td>
                    <td className="data-table__cell data-table__cell">{l.documentNumber}</td>
                    <td className="data-table__cell data-table__cell">{l.partnerName}</td>
                    <td className="data-table__cell data-table__cell">{formatMoney(l.totalGravada)}</td>
                    <td className="data-table__cell data-table__cell">{formatMoney(l.totalIva)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={generateTarget != null}
        title="Reemplazar borrador de IVA"
        description={
          generateTarget
            ? `¿Generar de nuevo ${generateTarget.label} del período ${String(month).padStart(2, "0")}/${year}? El borrador actual de ese período se reemplazará.`
            : "Confirma la generación del libro IVA."
        }
        confirmLabel="Reemplazar borrador"
        loading={submitting}
        error={generateError}
        onConfirm={() => {
          if (generateTarget) void generateReport(generateTarget.reportType);
        }}
        onCancel={() => {
          if (!submitting) {
            setGenerateTarget(null);
            setGenerateError(null);
          }
        }}
      />

      <ConfirmDialog
        open={closeTarget != null}
        title="Cerrar libro IVA"
        description={
          closeTarget
            ? `¿Cerrar el libro IVA de ${closeTarget.label} de ${String(month).padStart(2, "0")}/${year}? Una vez cerrado no admite cambios.`
            : "Confirma el cierre del libro IVA."
        }
        confirmLabel="Cerrar libro"
        loading={submitting}
        error={closeError}
        onConfirm={() => void confirmClose()}
        onCancel={() => {
          if (!submitting) {
            setCloseTarget(null);
            setCloseError(null);
          }
        }}
      />
    </div>
  );
}
