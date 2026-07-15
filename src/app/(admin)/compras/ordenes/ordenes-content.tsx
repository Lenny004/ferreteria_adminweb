"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import type { PurchaseOrderRow } from "@/lib/api/purchase-orders";
import {
  usePurchaseOrderPickers,
  usePurchaseOrders,
} from "@/hooks/use-purchase-orders";

function formatMoney(value: string | number) {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("es-SV", { style: "currency", currency: "USD" });
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-SV");
}

const STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  CONFIRMADA: "Confirmada",
  RECIBIDA: "Recibida",
  CANCELADA: "Cancelada",
};

type LineDraft = { productId: string; quantity: string; unitCost: string };

export default function OrdenesContent() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const {
    items,
    total,
    loading,
    createOrder,
    confirmOrder,
    receiveOrder,
    cancelOrder,
    submitting,
  } = usePurchaseOrders({ q: search, status: statusFilter || undefined });
  const pickers = usePurchaseOrderPickers();

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

  async function onConfirm(id: string) {
    try {
      await confirmOrder(id);
      toast.success("Orden confirmada");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo confirmar");
    }
  }

  async function onCancel(id: string) {
    try {
      await cancelOrder(id);
      toast.success("Orden cancelada");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cancelar");
    }
  }

  async function onReceiveSubmit(event: FormEvent) {
    event.preventDefault();
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
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo recibir");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Órdenes de compra</h1>
          <p className="text-sm text-muted-foreground">
            Flujo BORRADOR → CONFIRMADA → RECIBIDA. Al recibir se aplica costo promedio ponderado.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          Nueva orden
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <input
            className="h-10 flex-1 rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Proveedor o documento"
          />
          <select
            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
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
          <Button type="button" variant="outline" onClick={() => setSearch(q.trim())}>
            Buscar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listado ({total})</CardTitle>
          <CardDescription>Confirmá y recibí para impactar inventario</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin órdenes.</p>
          ) : (
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Fecha</th>
                  <th className="pb-2 pr-3 font-medium">Proveedor</th>
                  <th className="pb-2 pr-3 font-medium">Estado</th>
                  <th className="pb-2 pr-3 font-medium">Doc.</th>
                  <th className="pb-2 pr-3 font-medium">Total</th>
                  <th className="pb-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-3">{formatDate(row.createdAt)}</td>
                    <td className="py-2.5 pr-3">{row.supplier?.name ?? "—"}</td>
                    <td className="py-2.5 pr-3">
                      {STATUS_LABEL[row.status] ?? row.status}
                    </td>
                    <td className="py-2.5 pr-3">
                      {row.supplierDocType
                        ? `${row.supplierDocType} ${row.supplierDocNumber ?? ""}`
                        : "—"}
                    </td>
                    <td className="py-2.5 pr-3">{formatMoney(row.total)}</td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-2">
                        {row.status === "BORRADOR" ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={submitting}
                              onClick={() => onConfirm(row.id)}
                            >
                              Confirmar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={submitting}
                              onClick={() => onCancel(row.id)}
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
                            onClick={() => onCancel(row.id)}
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

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <CardHeader>
              <CardTitle>Nueva orden de compra</CardTitle>
              <CardDescription>Se crea en estado BORRADOR</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={onCreate}>
                <label className="grid gap-1 text-sm">
                  <span>Proveedor *</span>
                  <select
                    required
                    className="h-10 rounded-md border border-border px-3"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                  >
                    <option value="">Seleccionar…</option>
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
                        <option value="">Producto…</option>
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
                    Cerrar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Guardando…" : "Crear borrador"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {receiveOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Recibir orden</CardTitle>
              <CardDescription>
                Genera entradas de inventario y actualiza el costo promedio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={onReceiveSubmit}>
                <p className="text-sm text-muted-foreground">
                  {receiveOpen.supplier?.name} — {formatMoney(receiveOpen.total)}
                </p>
                <label className="grid gap-1 text-sm">
                  <span>Tipo documento proveedor</span>
                  <select
                    className="h-10 rounded-md border border-border px-3"
                    value={receiveDocType}
                    onChange={(e) =>
                      setReceiveDocType(e.target.value as "CCF" | "FAC" | "OTRO")
                    }
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
                <div className="mt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setReceiveOpen(null)}>
                    Cerrar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Recibiendo…" : "Confirmar recepción"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
