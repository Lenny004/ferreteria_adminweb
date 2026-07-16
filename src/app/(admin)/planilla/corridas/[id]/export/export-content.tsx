"use client";

import { PageHeader } from "@/components/layout/page-header";
/**
 * Exportaciones de corrida: Excel de planilla, boletas PDF y Planilla Única AFP/ISSS.
 */
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { payrollExportsApi, type PayrollRunStatus } from "@/lib/api/payroll";
import { usePayrollRun } from "@/hooks/use-payroll";

const STATUS_LABEL: Record<PayrollRunStatus, string> = {
  EN_REVISION: "En revisión",
  APROBADA: "Aprobada",
  PAGADA: "Pagada",
  ANULADA: "Anulada",
};

type ExportKind = "excel" | "receipts-pdf" | "planilla-unica";

const EXPORT_OPTIONS: {
  kind: ExportKind;
  icon: typeof FileSpreadsheet;
  title: string;
  description: string;
  extension: string;
}[] = [
  {
    kind: "excel",
    icon: FileSpreadsheet,
    title: "Excel de planilla",
    description: "Detalle por empleado (salario, deducciones, neto) con fila de totales.",
    extension: ".xlsx",
  },
  {
    kind: "receipts-pdf",
    icon: FileText,
    title: "Boletas de pago",
    description: "PDF multi-página con una boleta de pago por empleado.",
    extension: ".pdf",
  },
  {
    kind: "planilla-unica",
    icon: FileSpreadsheet,
    title: "Planilla Única AFP/ISSS",
    description: "Formato de cotizaciones previsionales y de seguridad.",
    extension: ".xlsx",
  },
];

/** Panel de descarga de artefactos de exportación de una corrida de planilla. */
export default function ExportCorridaContent({ runId }: { runId: string }) {
  const { run, loading } = usePayrollRun(runId);
  const [pending, setPending] = useState<ExportKind | null>(null);

  async function handleDownload(kind: ExportKind) {
    setPending(kind);
    try {
      if (kind === "excel") await payrollExportsApi.downloadExcel(runId);
      else if (kind === "receipts-pdf") await payrollExportsApi.downloadReceiptsPdf(runId);
      else await payrollExportsApi.downloadPlanillaUnica(runId);
      toast.success("Descarga iniciada");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo generar el archivo");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="page-stack">
      <Button asChild variant="outline" size="sm">
        <Link href="/planilla/corridas">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Volver a corridas
        </Link>
      </Button>

      <PageHeader
        title="Exportar corrida"
        description={
          loading || !run
            ? "Cargando…"
            : `${run.name} · ${run.periodName} · ${STATUS_LABEL[run.status]}`
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {EXPORT_OPTIONS.map(({ kind, icon: Icon, title, description, extension }) => (
          <Card key={kind}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                disabled={pending !== null}
                onClick={() => handleDownload(kind)}
              >
                <Download className="mr-2 h-4 w-4" />
                {pending === kind ? "Generando…" : `Descargar ${extension}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
