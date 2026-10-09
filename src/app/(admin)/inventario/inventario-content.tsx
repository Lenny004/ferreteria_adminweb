"use client";

/**
 * Inventario admin: movimientos manuales, Kardex, alertas de mínimo y valuación a costo promedio.
 * Las ventas y devoluciones las registran la caja WPF y la tienda en línea; no este módulo.
 */
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import {
  ADMIN_MOVEMENT_TYPES,
  MOVEMENT_LABELS,
  MOVEMENT_TYPES,
  type AdminInventoryMovementType,
  formatSignedQuantity,
  movementDirection,
  movementDirectionClass,
  movementLabel,
} from "@/lib/inventory-movements";
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

/**
 * Panel de inventario para registrar movimientos, revisar alertas y consultar la valuación.
 */
export default function InventarioContent() {
  const [movementProductId, setMovementProductId] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState("");
  const [showResolvedAlerts, setShowResolvedAlerts] = useState(false);
  const movementsQuery = useInventoryMovements({
    productId: movementProductId || undefined,
    movementType: movementTypeFilter || undefined,
  });
  const alertsQuery = useStockAlerts(showResolvedAlerts);
  const valuationQuery = useInventoryValuation();
  const createMut = useCreateMovement();
  const resolveMut = useResolveAlert();

  const [productId, setProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [movementType, setMovementType] = useState<AdminInventoryMovementType>(
    "ENTRADA_COMPRA",
  );
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [reason, setReason] = useState("");

  const productsQuery = useProductsForInventory(productSearch);
  const filterProductsQuery = useProductsForInventory("");
  const products = useMemo(() => productsQuery.data?.items ?? [], [productsQuery.data?.items]);
  const filterProducts = filterProductsQuery.data?.items ?? [];
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
        actions={
          <Button asChild variant="outline">
            <Link href="/inventario/conteos">Conteos físicos</Link>
          </Button>
        }
        description="Entradas, ajustes, Kardex y alertas de stock mínimo."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registrar movimiento</CardTitle>
            <CardDescription>
              Tipos admin: {ADMIN_MOVEMENT_TYPES.map((type) => MOVEMENT_LABELS[type]).join(", ")}.
              Las ventas las registra la caja WPF.
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
                  <option value="">{productsQuery.isError ? "Error al cargar productos" : "— Seleccionar —"}</option>
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
                  {ADMIN_MOVEMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {MOVEMENT_LABELS[type]}
                    </option>
                  ))}
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
            <CardDescription>
              {showResolvedAlerts
                ? "Alertas ya atendidas"
                : "Productos bajo el mínimo, sin resolver"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertsQuery.isError ? <QueryErrorState compact error={alertsQuery.error} onRetry={() => void alertsQuery.refetch()} /> : null}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showResolvedAlerts}
                onChange={(e) => setShowResolvedAlerts(e.target.checked)}
              />
              Mostrar alertas atendidas
            </label>
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
                {!alert.isResolved ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resolveMut.isPending}
                    onClick={() => onResolve(alert.id)}
                  >
                    Atender
                  </Button>
                ) : null}
              </div>
            ))}
            {!alertsQuery.isLoading && !alertsQuery.isError && (alertsQuery.data?.items.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                {showResolvedAlerts ? "Sin alertas atendidas." : "Sin alertas abiertas."}
              </p>
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
        <CardContent className="table-container">
          {valuationQuery.isError ? <QueryErrorState compact error={valuationQuery.error} onRetry={() => void valuationQuery.refetch()} /> : null}
          <table className="data-table min-w-[640px]">
            <thead className="data-table__head">
              <tr className="data-table__row">
                <th className="data-table__cell data-table__cell--heading">Producto</th>
                <th className="data-table__cell data-table__cell--heading">Stock</th>
                <th className="data-table__cell data-table__cell--heading">Costo prom.</th>
                <th className="data-table__cell data-table__cell--heading">Valor</th>
              </tr>
            </thead>
            <tbody className="data-table__body">
              {(valuationQuery.data?.items ?? []).slice(0, 15).map((p) => (
                <tr key={p.id} className="data-table__row">
                  <td className="data-table__cell">
                    <div className="font-medium">{p.code}</div>
                    <div className="text-xs text-muted-foreground">{p.description}</div>
                  </td>
                  <td className="data-table__cell">{formatQty(p.currentStock)}</td>
                  <td className="data-table__cell">{formatMoney(p.costPrice)}</td>
                  <td className="data-table__cell">{formatMoney(p.inventoryValue)}</td>
                </tr>
              ))}
              {!valuationQuery.isLoading && !valuationQuery.isError && (valuationQuery.data?.items.length ?? 0) === 0 ? (
                <tr className="data-table__row">
                  <td colSpan={4} className="text-center text-muted-foreground data-table__cell">
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
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Producto</span>
              <select
                className="h-10 rounded-md border border-border bg-card px-3"
                value={movementProductId}
                onChange={(e) => setMovementProductId(e.target.value)}
              >
                <option value="">Todos</option>
                {filterProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.description}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Tipo de movimiento</span>
              <select
                className="h-10 rounded-md border border-border bg-card px-3"
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
              >
                <option value="">Todos</option>
                {MOVEMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {MOVEMENT_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMovementProductId("");
                  setMovementTypeFilter("");
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
          <div className="table-container">
          {movementsQuery.isError ? <QueryErrorState compact error={movementsQuery.error} onRetry={() => void movementsQuery.refetch()} /> : null}
          <table className="data-table min-w-[800px]">
            <thead className="data-table__head">
              <tr className="data-table__row">
                <th className="data-table__cell data-table__cell--heading">Fecha</th>
                <th className="data-table__cell data-table__cell--heading">Producto</th>
                <th className="data-table__cell data-table__cell--heading">Tipo</th>
                <th className="data-table__cell data-table__cell--heading">Cant.</th>
                <th className="data-table__cell data-table__cell--heading">Antes → Después</th>
                <th className="data-table__cell data-table__cell--heading">Motivo</th>
              </tr>
            </thead>
            <tbody className="data-table__body">
              {(movementsQuery.data?.items ?? []).map((m) => {
                const direction = movementDirection(m);
                const formattedQuantity = formatSignedQuantity(m.quantity, direction);
                const quantityLabel = direction
                  ? `${direction === "ENTRADA" ? "Entrada" : "Salida"} de ${formatSignedQuantity(m.quantity, null)}`
                  : formattedQuantity;

                return (
                <tr key={m.id} className="data-table__row">
                  <td className="whitespace-nowrap data-table__cell">{formatDateTime(m.createdAt)}</td>
                  <td className="data-table__cell">
                    <div className="font-medium">{m.product?.code}</div>
                    <div className="text-xs text-muted-foreground">{m.product?.description}</div>
                  </td>
                  <td className="data-table__cell">
                    {movementLabel(m.movementType)}
                  </td>
                  <td
                    data-testid="movement-qty"
                    data-direction={direction ?? ""}
                    className={`data-table__cell ${movementDirectionClass(direction)}`}
                    aria-label={quantityLabel}
                    title={quantityLabel}
                  >
                    {formattedQuantity}
                  </td>
                  <td className="data-table__cell">
                    {formatQty(m.stockBefore)} → {formatQty(m.stockAfter)}
                  </td>
                  <td className="text-muted-foreground data-table__cell">{m.reason ?? "—"}</td>
                </tr>
                );
              })}
              {!movementsQuery.isLoading && !movementsQuery.isError && (movementsQuery.data?.items.length ?? 0) === 0 ? (
                <tr className="data-table__row">
                  <td colSpan={6} className="text-center text-muted-foreground data-table__cell">
                    Aún no hay movimientos. Crea productos y registra una entrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
