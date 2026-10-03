"use client";

/**
 * Detalle operativo de un conteo físico, con captura por línea y acciones de cierre.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/dialog";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { useSession } from "@/contexts/session-context";
import {
  useApplyInventoryCount,
  useCancelInventoryCount,
  useCaptureInventoryCount,
  useInventoryCount,
  useInventoryCountLines,
} from "@/hooks/use-inventory-counts";
import type { InventoryCountLine, InventoryCountStatus } from "@/lib/api/inventory-counts";
import { ApiError } from "@/lib/api";
import {
  calculateUiVariance,
  canWriteCounts,
  formatVariance,
  getVarianceClass,
  validateCountedQuantity,
} from "@/lib/inventory-counts";
import { formatDateTime, formatMoney } from "@/lib/utils";

const PAGE_SIZE = 50;

function formatQuantity(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toLocaleString("es-SV", { maximumFractionDigits: 3 }) : String(value);
}

function statusLabel(status: InventoryCountStatus): string {
  return status === "ABIERTO" ? "Abierto" : status === "APLICADO" ? "Aplicado" : "Cancelado";
}

function statusVariant(status: InventoryCountStatus): BadgeProps["variant"] {
  return status === "ABIERTO" ? "warning" : status === "APLICADO" ? "success" : "muted";
}

type SummaryCardProps = { label: string; value: string; tone?: string };

function SummaryCard({ label, value, tone }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-lg font-semibold tabular-nums ${tone ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

/**
 * Muestra las líneas y limita las acciones de escritura a ADMIN y OWNER en estado ABIERTO.
 * @param id - Identificador UUID del conteo recibido desde la ruta.
 */
export default function ConteoDetalleContent({ id }: { id: string }) {
  const { user } = useSession();
  const canWrite = user ? canWriteCounts(user.role) : false;
  const countQuery = useInventoryCount(id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "counted" | "variance">("all");
  const [page, setPage] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draftMeta, setDraftMeta] = useState<Record<string, { decimals: number }>>({});
  const [modified, setModified] = useState<Set<string>>(() => new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [applyOpen, setApplyOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const linesQuery = useInventoryCountLines(id, { q: search.trim() || undefined, filter, take: PAGE_SIZE, skip: page * PAGE_SIZE });
  const captureMutation = useCaptureInventoryCount();
  const applyMutation = useApplyInventoryCount();
  const cancelMutation = useCancelInventoryCount();
  const count = countQuery.data;
  const lines = linesQuery.data?.items ?? [];
  const canEdit = canWrite && count?.status === "ABIERTO";
  const modifiedIds = useMemo(() => Array.from(modified), [modified]);
  const hasValidationErrors = modifiedIds.some((productId) => Boolean(errors[productId]));
  const hasChanges = modifiedIds.length > 0;

  function lineValue(line: InventoryCountLine): string {
    return drafts[line.productId] ?? (line.countedQuantity === null ? "" : String(line.countedQuantity));
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(0);
  }

  function handleFilter(value: "all" | "pending" | "counted" | "variance") {
    setFilter(value);
    setPage(0);
  }

  function handleQuantityChange(line: InventoryCountLine, value: string) {
    const original = line.countedQuantity === null ? "" : String(line.countedQuantity);
    const validation = validateCountedQuantity(value, line.product.decimals);
    setDrafts((current) => ({ ...current, [line.productId]: value }));
    setDraftMeta((current) => ({ ...current, [line.productId]: { decimals: line.product.decimals } }));
    setModified((current) => {
      const next = new Set(current);
      if (value === original) next.delete(line.productId);
      else next.add(line.productId);
      return next;
    });
    setErrors((current) => {
      const next = { ...current };
      if (validation) next[line.productId] = validation;
      else delete next[line.productId];
      return next;
    });
  }

  async function saveCaptures() {
    if (!canEdit || !hasChanges) return;
    const nextErrors: Record<string, string> = {};
    const items: Array<{ productId: string; countedQuantity: number }> = [];
    for (const productId of modifiedIds) {
      const value = drafts[productId] ?? "";
      const validation = validateCountedQuantity(value, draftMeta[productId]?.decimals ?? 3);
      if (validation) nextErrors[productId] = validation;
      else items.push({ productId, countedQuantity: Number(value) });
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    try {
      for (const batch of chunkItems(items, 500)) await captureMutation.mutateAsync({ id, items: batch });
      setModified(new Set());
      setDrafts({});
      setDraftMeta({});
      toast.success(`${items.length} captura${items.length === 1 ? "" : "s"} guardada${items.length === 1 ? "" : "s"}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudieron guardar las capturas");
    }
  }

  async function exportCount() {
    try {
      const { inventoryCountsApi } = await import("@/lib/api/inventory-counts");
      await inventoryCountsApi.exportXlsx(id, count?.folio);
      toast.success("Descarga iniciada");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo exportar el conteo");
    }
  }

  async function applyCount() {
    try {
      await applyMutation.mutateAsync(id);
      setApplyOpen(false);
      toast.success("Conteo aplicado y ajustes generados");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo aplicar el conteo");
    }
  }

  async function cancelCount() {
    try {
      await cancelMutation.mutateAsync({ id, reason: cancelReason.trim() || null });
      setCancelOpen(false);
      setCancelReason("");
      toast.success("Conteo cancelado");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo cancelar el conteo");
    }
  }

  if (countQuery.isError) return <QueryErrorState error={countQuery.error} onRetry={() => void countQuery.refetch()} />;
  if (countQuery.isLoading || !count) return <p className="text-sm text-muted-foreground">Cargando conteo…</p>;

  return (
    <div className="page-stack">
      <PageHeader
        title={`Conteo #${count.folio}`}
        description={`${count.name} · creado ${formatDateTime(count.createdAt)}${count.appliedAt ? ` · aplicado ${formatDateTime(count.appliedAt)}` : ""}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link href="/inventario/conteos">Volver</Link></Button>
            <Button variant="outline" onClick={() => void exportCount()}>Exportar Excel</Button>
            {canEdit ? <Button variant="outline" onClick={() => void saveCaptures()} disabled={!hasChanges || hasValidationErrors || captureMutation.isPending}>{captureMutation.isPending ? "Guardando…" : "Guardar capturas"}</Button> : null}
            {canEdit ? <Button onClick={() => setApplyOpen(true)} disabled={hasChanges || hasValidationErrors || applyMutation.isPending}>Aplicar conteo</Button> : null}
            {canEdit ? <Button variant="danger" onClick={() => setCancelOpen(true)} disabled={cancelMutation.isPending}>Cancelar conteo</Button> : null}
          </div>
        }
      />

      <div className="flex items-center gap-2"><Badge variant={statusVariant(count.status)}>{statusLabel(count.status)}</Badge>{count.notes ? <span className="text-sm text-muted-foreground">{count.notes}</span> : null}</div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Líneas" value={String(count.summary.totalLines)} />
        <SummaryCard label="Contadas" value={String(count.summary.countedLines)} />
        <SummaryCard label="Pendientes" value={String(count.summary.pendingLines)} tone={count.summary.pendingLines > 0 ? "text-warning" : undefined} />
        <SummaryCard label="Con diferencia" value={String(count.summary.linesWithVariance)} />
        <SummaryCard label="Sobrante" value={`${formatQuantity(count.summary.surplusQty)} · ${formatMoney(count.summary.surplusValue)}`} tone="text-success" />
        <SummaryCard label="Faltante" value={`${formatQuantity(count.summary.shortageQty)} · ${formatMoney(count.summary.shortageValue)}`} tone="text-danger" />
        <SummaryCard label="Neto cantidad" value={formatVariance(count.summary.netQty)} tone={getVarianceClass(count.summary.netQty)} />
        <SummaryCard label="Neto valor" value={formatMoney(count.summary.netValue)} tone={getVarianceClass(count.summary.netValue)} />
      </div>

      {canEdit && hasChanges ? <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">Hay cambios sin guardar. Guarda las capturas antes de aplicar el conteo.</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Líneas del conteo</CardTitle>
          <CardDescription>La diferencia se calcula como contado − stock al momento de guardar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <Input aria-label="Buscar líneas" placeholder="Buscar por código o descripción" value={search} onChange={(event) => handleSearch(event.target.value)} />
            <select className="h-10 rounded-lg border border-border bg-card px-3 text-sm" value={filter} onChange={(event) => handleFilter(event.target.value as typeof filter)}>
              <option value="all">Todas</option>
              <option value="pending">Pendientes</option>
              <option value="counted">Contadas</option>
              <option value="variance">Con diferencia</option>
            </select>
          </div>
          {linesQuery.isError ? <QueryErrorState compact error={linesQuery.error} onRetry={() => void linesQuery.refetch()} /> : null}
          <div className="data-table-wrap">
            <table className="data-table min-w-[1050px]">
              <thead><tr><th>Producto</th><th>Unidad</th><th>Stock actual</th><th>Contado guardado</th><th>Captura</th><th>Diferencia</th><th>Valor</th></tr></thead>
              <tbody>
                {lines.map((line) => {
                  const value = lineValue(line);
                  const hasDraft = Object.prototype.hasOwnProperty.call(drafts, line.productId);
                  // Un borrador se guardará contra el stock vigente, así que la vista previa no usa el stock congelado anterior.
                  const variance = calculateUiVariance(value, hasDraft ? null : line.systemStockAtCount, line.product.currentStock);
                  const varianceValue = hasDraft
                    ? variance === null ? null : variance * Number(line.product.costPrice)
                    : line.varianceValue ?? (variance === null ? null : variance * Number(line.product.costPrice));
                  const error = errors[line.productId];
                  return (
                    <tr key={line.id}>
                      <td><div className="font-medium">{line.product.code}</div><div className="text-xs text-muted-foreground">{line.product.description}</div></td>
                      <td>{line.product.unit}</td>
                      <td>{formatQuantity(line.product.currentStock)}</td>
                      <td>{formatQuantity(line.countedQuantity)}</td>
                      <td>
                        {canEdit ? <div className="min-w-36"><Input aria-label={`Captura ${line.product.code}`} type="number" min="0" step={line.product.decimals === 0 ? "1" : `0.${"0".repeat(Math.max(0, line.product.decimals - 1))}1`} value={value} onChange={(event) => handleQuantityChange(line, event.target.value)} aria-invalid={Boolean(error)} />{error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}</div> : <span>{formatQuantity(line.countedQuantity)}</span>}
                      </td>
                      <td className={`font-medium tabular-nums ${getVarianceClass(variance)}`}>{formatVariance(variance, line.product.decimals)}</td>
                      <td className={`tabular-nums ${getVarianceClass(varianceValue)}`}>{formatMoney(varianceValue)}</td>
                    </tr>
                  );
                })}
                {!linesQuery.isLoading && !linesQuery.isError && lines.length === 0 ? <tr><td colSpan={7} className="text-center text-muted-foreground">No hay líneas para este filtro.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={linesQuery.data?.total ?? 0} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Modal open={applyOpen} onOpenChange={setApplyOpen} title="Aplicar conteo" description="Esta acción genera ajustes en inventario y no se puede deshacer desde el panel.">
        <div className="space-y-4">
          <p className="text-sm">Las {count.summary.pendingLines} líneas pendientes se omitirán. Se aplicarán los valores contados y sus diferencias.</p>
          <div className="grid gap-2 rounded-lg bg-muted p-3 text-sm sm:grid-cols-3"><span>Sobrante: <strong className="text-success">{formatQuantity(count.summary.surplusQty)}</strong></span><span>Faltante: <strong className="text-danger">{formatQuantity(count.summary.shortageQty)}</strong></span><span>Neto: <strong>{formatMoney(count.summary.netValue)}</strong></span></div>
          {hasChanges ? <p className="text-sm text-danger">Primero guarda las capturas pendientes.</p> : null}
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setApplyOpen(false)}>Cerrar</Button><Button onClick={() => void applyCount()} disabled={hasChanges || hasValidationErrors || applyMutation.isPending}>{applyMutation.isPending ? "Aplicando…" : "Confirmar aplicación"}</Button></div>
        </div>
      </Modal>

      <Modal open={cancelOpen} onOpenChange={setCancelOpen} title="Cancelar conteo" description="El conteo quedará inmutable y no generará ajustes.">
        <div className="space-y-4"><label className="grid gap-1 text-sm"><span>Motivo <span className="text-muted-foreground">(opcional)</span></span><Input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} maxLength={300} /></label><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setCancelOpen(false)}>Cerrar</Button><Button variant="danger" onClick={() => void cancelCount()} disabled={cancelMutation.isPending}>{cancelMutation.isPending ? "Cancelando…" : "Confirmar cancelación"}</Button></div></div>
      </Modal>
    </div>
  );
}
