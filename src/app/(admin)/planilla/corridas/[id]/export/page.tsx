/**
 * Exportación de una corrida Payroll (`/planilla/corridas/[id]/export`).
 * Descarga de Excel de planilla, boletas en PDF y Planilla Única AFP/ISSS.
 */

import ExportCorridaContent from "./export-content";

/** Exportación de PayrollRun por `id`. */
export default async function ExportCorridaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExportCorridaContent runId={id} />;
}
