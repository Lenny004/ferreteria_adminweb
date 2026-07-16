"use client";

/**
 * Inventario admin: movimientos manuales, Kardex, alertas de mínimo y valuación a costo promedio.
 * Ventas y devoluciones las registra la caja WPF, no este módulo.
 */
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/utils";
import {
  useCreateMovement,
  useInventoryMovements,
  useInventoryValuation,
  useProductsForInventory,
  useResolveAlert,
  useStockAlerts,
} from "@/hooks/use-inventory";

function formatQty(value: string | number) {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("es-SV", { maximumFractionDigits: 3 });
}

const MOVEMENT_LABELS: Record<string, string> = {
  ENTRADA_COMPRA: "Entrada compra",
  AJUSTE_ENTRADA: "Ajuste entrada",
  AJUSTE_SALIDA: "Ajuste salida",
  VENTA: "Venta",
  DEVOLUCION_VENTA: "Devolución venta",
};

export default function InventarioContent() {
  const movementsQuery = useInventoryMovements();
  const alertsQuery = useStockAlerts(false);
  const valuationQuery = useInventoryValuation();
  const createMut = useCreateMovement();
  const resolveMut = useResolveAlert();

  const [productId, setProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [movementType, setMovementType] = useState<
    "ENTRADA_COMPRA" | "AJUSTE_ENTRADA" | "AJUSTE_SALIDA"
  >("ENTRADA_COMPRA");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [reason, setReason] = useState("");

  const productsQuery = useProductsForInventory(productSearch);
  const products = productsQuery.data?.items ?? [];
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!productId) {
      toast.error("Selecciona un producto");
      return;
    }
    try {
      await createMut.mutateAsync({
        productId,
        movementType,
        quantity: Number(quantity),
        unitCost: unitCost ? Number(unitCost) : undefined,
        reason: reason.trim() || null,
      });
      toast.success("Movimiento registrado");
      setQuantity("1");
      setReason("");
      setUnitCost("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo registrar");
    }
  }

  async function onResolve(id: string) {
    try {
      await resolveMut.mutateAsync(id);
      toast.success("Alerta marcada como atendida");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo resolver");
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Inventario"
        description="Entradas, ajustes, Kardex y alertas de stock mínimo."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registrar movimiento</CardTitle>
            <CardDescription>
              Tipos admin: entrada compra, ajuste entrada/salida. Las ventas las registra la caja
              WPF.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={onSubmit}>
              <label className="space-y-1 text-sm">
                <span>Buscar producto</span>
                <input
                  className="h-10 w-full rounded-md border border-border bg-card px-3"
                  placeholder="Código o descripción"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Producto *</span>
                <select
                  required
                  className="h-10 w-full rounded-md border border-border bg-card px-3"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">— Seleccionar —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.description} (stock {formatQty(p.currentStock)})
                    </option>
                  ))}
                </select>
              </label>
              {selectedProduct ? (
                <p className="text-xs text-muted-foreground">
                  Mínimo: {formatQty(selectedProduct.minStock)} · Costo:{" "}
                  {formatQty(selectedProduct.costPrice)}
                </p>
              ) : null}
              <label className="space-y-1 text-sm">
                <span>Tipo</span>
                <select
                  className="h-10 w-full rounded-md border border-border bg-card px-3"
                  value={movementType}
                  onChange={(e) =>
                    setMovementType(e.target.value as typeof movementType)
                  }
                >
                  <option value="ENTRADA_COMPRA">Entrada compra</option>
                  <option value="AJUSTE_ENTRADA">Ajuste entrada</option>
                  <option value="AJUSTE_SALIDA">Ajuste salida</option>
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span>Cantidad *</span>
                  <input
                    type="number"
                    min={0.001}
                    step="any"
                    required
                    className="h-10 w-full rounded-md border border-border px-3"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span>Costo unitario (opc.)</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className="h-10 w-full rounded-md border border-border px-3"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                  />
                </label>
              </div>
              <label className="space-y-1 text-sm">
                <span>Motivo</span>
                <input
                  className="h-10 w-full rounded-md border border-border px-3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={300}
                />
              </label>
              <Button type="submit" disabled={createMut.isPending}>
                {createMut.isPending ? "Guardando…" : "Registrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Alertas de stock ({alertsQuery.data?.total ?? 0})
            </CardTitle>
            <CardDescription>Productos bajo el mínimo, sin resolver</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(alertsQuery.data?.items ?? []).map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
              >
                <div className="min-w-0 text-sm">
                  <div className="font-medium">
                    {alert.product?.code} — {alert.product?.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Stock {formatQty(alert.currentStock)} / mín {formatQty(alert.minStock)}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={resolveMut.isPending}
                  onClick={() => onResolve(alert.id)}
                >
                  Atender
                </Button>
              </div>
            ))}
            {!alertsQuery.isLoading && (alertsQuery.data?.items.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Sin alertas abiertas.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Valuación de inventario</CardTitle>
          <CardDescription>
            Total a costo promedio:{" "}
            {valuationQuery.data
              ? formatMoney(valuationQuery.data.totalInventoryValue)
              : "…"}
          </CardDescription>
        </CardHeader>
        <CardContent className="data-table-wrap">
          <table className="data-table min-w-[640px]">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock</th>
                <th>Costo prom.</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {(valuationQuery.data?.items ?? []).slice(0, 15).map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="font-medium">{p.code}</div>
                    <div className="text-xs text-muted-foreground">{p.description}</div>
                  </td>
                  <td>{formatQty(p.currentStock)}</td>
                  <td>{formatMoney(p.costPrice)}</td>
                  <td>{formatMoney(p.inventoryValue)}</td>
                </tr>
              ))}
              {!valuationQuery.isLoading && (valuationQuery.data?.items.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted-foreground">
                    Sin productos activos.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Movimientos recientes ({movementsQuery.data?.total ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="data-table-wrap">
          <table className="data-table min-w-[800px]">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cant.</th>
                <th>Antes → Después</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {(movementsQuery.data?.items ?? []).map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                  <td>
                    <div className="font-medium">{m.product?.code}</div>
                    <div className="text-xs text-muted-foreground">{m.product?.description}</div>
                  </td>
                  <td>
                    {MOVEMENT_LABELS[m.movementType] ?? m.movementType}
                  </td>
                  <td>{formatQty(m.quantity)}</td>
                  <td>
                    {formatQty(m.stockBefore)} → {formatQty(m.stockAfter)}
                  </td>
                  <td className="text-muted-foreground">{m.reason ?? "—"}</td>
                </tr>
              ))}
              {!movementsQuery.isLoading && (movementsQuery.data?.items.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground">
                    Aún no hay movimientos. Crea productos y registra una entrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
