"use client";

/**
 * Órdenes de compra: alta y ciclo BORRADOR → CONFIRMADA → RECIBIDA.
 * Al recibir, el backend actualiza stock y costo promedio ponderado.
 */

import { PageHeader } from "@/components/layout/page-header";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/utils";
import type { PurchaseOrderRow } from "@/lib/api/purchase-orders";
import {
  usePurchaseOrderPickers,
  usePurchaseOrders,
} from "@/hooks/use-purchase-orders";

const STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  CONFIRMADA: "Confirmada",
  RECIBIDA: "Recibida",
  CANCELADA: "Cancelada",
};

type LineDraft = { productId: string; quantity: string; unitCost: string };

type OrderConfirmation = {
  action: "confirm" | "cancel";
  row: PurchaseOrderRow;
};

/** Lista y gestiona órdenes de compra y sus cambios de estado. */
export default function OrdenesContent() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [onlyWithDoc, setOnlyWithDoc] = useState(false);
  const {
    items,
    total,
    loading,
    isError,
    error,
    refresh,
    createOrder,
    confirmOrder,
    receiveOrder,
    cancelOrder,
    submitting,
  } = usePurchaseOrders({
    q: search,
    status: statusFilter || undefined,
    supplierId: supplierFilter || undefined,
  });
  const pickers = usePurchaseOrderPickers();

  const visibleItems = onlyWithDoc
    ? items.filter((o) => Boolean(o.supplierDocNumber?.trim()))
    : items;

  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [docType, setDocType] = useState<"CCF" | "FAC" | "OTRO" | "">("");
  const [docNumber, setDocNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([
    { productId: "", quantity: "1", unitCost: "" },
  ]);

  const [receiveOpen, setReceiveOpen] = useState<PurchaseOrderRow | null>(null);
  const [receiveDocType, setReceiveDocType] = useState<"CCF" | "FAC" | "OTRO">("CCF");
  const [receiveDocNumber, setReceiveDocNumber] = useState("");
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  function resetForm() {
    setSupplierId("");
    setDocType("");
    setDocNumber("");
    setNotes("");
    setLines([{ productId: "", quantity: "1", unitCost: "" }]);
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!supplierId) {
      toast.error("Selecciona un proveedor");
      return;
    }
    const parsed = lines
      .filter((l) => l.productId)
      .map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
        unitCost: Number(l.unitCost),
      }));
    if (!parsed.length) {
      toast.error("Agrega al menos una línea");
      return;
    }
    if (parsed.some((l) => !(l.quantity > 0) || !(l.unitCost > 0))) {
      toast.error("Cantidad y costo deben ser mayores que cero");
      return;
    }
    try {
      await createOrder({
        supplierId,
        supplierDocType: docType || null,
        supplierDocNumber: docNumber.trim() || null,
        notes: notes.trim() || null,
        lines: parsed,
      });
      toast.success("Orden creada en borrador");
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo crear");
    }
  }

  /** Abre la confirmación de una transición de una orden de compra. */
  function openConfirmation(action: OrderConfirmation["action"], row: PurchaseOrderRow) {
    setConfirmation({ action, row });
    setConfirmationError(null);
  }

  /** Ejecuta confirmar o cancelar y deja el error dentro del diálogo si falla. */
  async function confirmTransition() {
    if (!confirmation) return;
    try {
      if (confirmation.action === "confirm") {
        await confirmOrder(confirmation.row.id);
        toast.success("Orden confirmada");
      } else {
        await cancelOrder(confirmation.row.id);
        toast.success("Orden cancelada");
      }
      setConfirmation(null);
      setConfirmationError(null);
    } catch (err) {
      setConfirmationError(err instanceof ApiError ? err.message : "No se pudo actualizar la orden");
    }
  }

  /** Recibe la orden con los datos del documento proveedor capturados en el diálogo. */
  async function onReceiveSubmit() {
    if (!receiveOpen) return;
    try {
      await receiveOrder({
        id: receiveOpen.id,
        docNumber: receiveDocNumber.trim() || undefined,
        docType: receiveDocType,
      });
      toast.success("Orden recibida: stock y costo promedio actualizados");
      setReceiveOpen(null);
      setReceiveDocNumber("");
      setConfirmationError(null);
    } catch (err) {
      setConfirmationError(err instanceof ApiError ? err.message : "No se pudo recibir la orden");
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Órdenes de compra"
        description="Flujo BORRADOR → CONFIRMADA → RECIBIDA. Al recibir se aplica costo promedio ponderado."
        actions={<Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          Nueva orden
        </Button>}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(q.trim());
            }}
          >
            <label className="grid gap-1 text-sm sm:col-span-2 lg:col-span-1">
              <span className="text-muted-foreground">Búsqueda</span>
              <input
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Proveedor o documento"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Estado</span>
              <select
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Proveedor</span>
              <select
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <option value="">{pickers.isError ? "Error al cargar" : "Todos"}</option>
                {pickers.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <input
                type="checkbox"
                checked={onlyWithDoc}
                onChange={(e) => setOnlyWithDoc(e.target.checked)}
              />
              Solo con documento fiscal
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="submit" variant="outline">
                Buscar
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setQ("");
                  setSearch("");
                  setStatusFilter("");
                  setSupplierFilter("");
                  setOnlyWithDoc(false);
                }}
              >
                Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Listado ({onlyWithDoc ? visibleItems.length : total})
          </CardTitle>
          <CardDescription>Confirmá y recibí para impactar inventario</CardDescription>
        </CardHeader>
        <CardContent className="table-container">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : isError ? (
            <QueryErrorState error={error} onRetry={() => void refresh()} />
          ) : visibleItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin órdenes.</p>
          ) : (
            <table className="data-table min-w-[800px]">
              <thead className="data-table__head">
                <tr className="data-table__row">
                  <th className="data-table__cell data-table__cell--heading">Fecha</th>
                  <th className="data-table__cell data-table__cell--heading">Creado por</th>
                  <th className="data-table__cell data-table__cell--heading">Proveedor</th>
                  <th className="data-table__cell data-table__cell--heading">Estado</th>
                  <th className="data-table__cell data-table__cell--heading">Doc.</th>
                  <th className="data-table__cell data-table__cell--heading">Total</th>
                  <th className="data-table__cell data-table__cell--heading">Acciones</th>
                </tr>
              </thead>
              <tbody className="data-table__body">
                {visibleItems.map((row) => (
                  <tr key={row.id} className="data-table__row">
                    <td className="data-table__cell">{formatDate(row.createdAt)}</td>
                    <td className="data-table__cell">{row.createdByWebUser?.username ?? "—"}</td>
                    <td className="data-table__cell">{row.supplier?.name ?? "—"}</td>
                    <td className="data-table__cell">
                      {STATUS_LABEL[row.status] ?? row.status}
                    </td>
                    <td className="data-table__cell">
                      {row.supplierDocType
                        ? `${row.supplierDocType} ${row.supplierDocNumber ?? ""}`
                        : "—"}
                    </td>
                    <td className="data-table__cell">{formatMoney(row.total)}</td>
                    <td className="data-table__cell">
                      <div className="flex flex-wrap gap-2">
                        {row.status === "BORRADOR" ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={submitting}
                              onClick={() => openConfirmation("confirm", row)}
                            >
                              Confirmar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={submitting}
                              onClick={() => openConfirmation("cancel", row)}
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : null}
                        {row.status === "CONFIRMADA" || row.status === "BORRADOR" ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={submitting}
                            onClick={() => {
                              setReceiveOpen(row);
                              setReceiveDocType(
                                (row.supplierDocType as "CCF" | "FAC" | "OTRO") || "CCF",
                              );
                              setReceiveDocNumber(row.supplierDocNumber ?? "");
                            }}
                          >
                            Recibir
                          </Button>
                        ) : null}
                        {row.status === "CONFIRMADA" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={submitting}
                            onClick={() => openConfirmation("cancel", row)}
                          >
                            Cancelar
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

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Nueva orden de compra"
        description="Se crea en estado BORRADOR"
        size="2xl"
      >
        <form className="grid gap-4" onSubmit={onCreate}>
          <label className="grid gap-1 text-sm">
            <span>Proveedor *</span>
            <select
              required
              className="h-10 rounded-md border border-border px-3"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">{pickers.isError ? "Error al cargar" : "Seleccionar…"}</option>
              {pickers.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span>Tipo doc.</span>
              <select
                className="h-10 rounded-md border border-border px-3"
                value={docType}
                onChange={(e) =>
                  setDocType(e.target.value as "" | "CCF" | "FAC" | "OTRO")
                }
              >
                <option value="">—</option>
                <option value="CCF">CCF</option>
                <option value="FAC">FAC</option>
                <option value="OTRO">OTRO</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Nº documento</span>
              <input
                className="h-10 rounded-md border border-border px-3"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
              />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Líneas</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setLines([...lines, { productId: "", quantity: "1", unitCost: "" }])
                }
              >
                + Línea
              </Button>
            </div>
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <select
                  className="col-span-6 h-10 rounded-md border border-border px-2 text-sm"
                  value={line.productId}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx] = { ...line, productId: e.target.value };
                    const p = pickers.products.find((x) => x.id === e.target.value);
                    if (p && !line.unitCost) {
                      next[idx].unitCost = String(p.costPrice);
                    }
                    setLines(next);
                  }}
                >
                  <option value="">{pickers.isError ? "Error al cargar" : "Producto…"}</option>
                  {pickers.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.description}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0.001}
                  step="any"
                  className="col-span-2 h-10 rounded-md border border-border px-2 text-sm"
                  placeholder="Cant."
                  value={line.quantity}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx] = { ...line, quantity: e.target.value };
                    setLines(next);
                  }}
                />
                <input
                  type="number"
                  min={0.0001}
                  step="any"
                  className="col-span-3 h-10 rounded-md border border-border px-2 text-sm"
                  placeholder="Costo"
                  value={line.unitCost}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx] = { ...line, unitCost: e.target.value };
                    setLines(next);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="col-span-1"
                  disabled={lines.length <= 1}
                  onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>

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
              {submitting ? "Guardando…" : "Crear borrador"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmation != null}
        title={confirmation?.action === "cancel" ? "Cancelar orden de compra" : "Confirmar orden de compra"}
        description={
          confirmation
            ? confirmation.action === "cancel"
              ? `¿Cancelar la orden de compra de ${confirmation.row.supplier?.name ?? "este proveedor"} por ${formatMoney(confirmation.row.total)}? La orden quedará cancelada y no podrá recibirse.`
              : `¿Confirmar la orden de compra de ${confirmation.row.supplier?.name ?? "este proveedor"} por ${formatMoney(confirmation.row.total)}? Pasará a preparación para recepción.`
            : "Confirma la transición de la orden."
        }
        confirmLabel={confirmation?.action === "cancel" ? "Cancelar orden" : "Confirmar orden"}
        destructive={confirmation?.action === "cancel"}
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

      <ConfirmDialog
        open={receiveOpen != null}
        title="Recibir orden de compra"
        description={
          receiveOpen
            ? `¿Recibir la orden de compra de ${receiveOpen.supplier?.name ?? "este proveedor"} por ${formatMoney(receiveOpen.total)}? Se generarán entradas de inventario y se actualizará el costo promedio.`
            : "Confirma la recepción de la orden."
        }
        confirmLabel="Recibir orden"
        loading={submitting}
        error={confirmationError}
        onConfirm={() => void onReceiveSubmit()}
        onCancel={() => {
          if (!submitting) {
            setReceiveOpen(null);
            setConfirmationError(null);
          }
        }}
      >
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Tipo documento proveedor</span>
            <select
              className="h-10 rounded-md border border-border px-3"
              value={receiveDocType}
              onChange={(e) => setReceiveDocType(e.target.value as "CCF" | "FAC" | "OTRO")}
            >
              <option value="CCF">CCF</option>
              <option value="FAC">FAC</option>
              <option value="OTRO">OTRO</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Nº documento</span>
            <input
              className="h-10 rounded-md border border-border px-3"
              value={receiveDocNumber}
              onChange={(e) => setReceiveDocNumber(e.target.value)}
              placeholder="Ej. CCF-00123"
            />
          </label>
        </div>
      </ConfirmDialog>
    </div>
  );
}
