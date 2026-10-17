"use client";

/**
 * Kardex de un producto: movimientos (más reciente primero) con saldo de unidades
 * y saldo valorado por línea, más el resumen del producto a costo promedio.
 * Es de solo lectura para todos los roles; los movimientos se registran en Inventario.
 */

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Pagination } from "@/components/ui/pagination";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { KARDEX_PAGE_SIZE, useProductKardex } from "@/hooks/use-products";
import {
  formatSignedQuantity,
  movementDirection,
  movementDirectionClass,
  movementLabel,
} from "@/lib/inventory-movements";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/utils";

/** Props del kardex: id del producto tomado de la ruta. */
type KardexContentProps = { productId: string };

/** Pantalla de kardex de un producto con paginación de movimientos. */
export default function KardexContent({ productId }: KardexContentProps) {
  const [page, setPage] = useState(0);
  const kardexQuery = useProductKardex(productId, page);
  const product = kardexQuery.data?.product;
  const items = kardexQuery.data?.items ?? [];
  const total = kardexQuery.data?.total ?? 0;

  return (
    <div className="page-stack">
      <PageHeader
        title={product ? `Kardex · ${product.code}` : "Kardex"}
        description={product?.description ?? "Historial de movimientos y saldo valorado del producto."}
        actions={
          <Button asChild variant="outline">
            <Link href="/inventario/productos">Volver a productos</Link>
          </Button>
        }
      />

      {kardexQuery.isError ? (
        <QueryErrorState error={kardexQuery.error} onRetry={() => void kardexQuery.refetch()} />
      ) : null}

      {product ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Stock actual" value={formatNumber(product.currentStock, 3)} />
          <SummaryCard label="Stock mínimo" value={formatNumber(product.minStock, 3)} />
          <SummaryCard label="Costo promedio" value={formatMoney(product.costPrice)} />
          <SummaryCard label="Valor en inventario" value={formatMoney(product.inventoryValue)} />
        </div>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Movimientos ({total})</CardTitle>
          <CardDescription>
            Saldo valorado = saldo en unidades × costo unitario del movimiento.
          </CardDescription>
        </CardHeader>
        <CardContent className="table-container">
          {kardexQuery.isLoading ? (
            <LoadingState label="Cargando kardex…" />
          ) : !kardexQuery.isError && items.length === 0 ? (
            <EmptyState title="Sin movimientos" description="Este producto aún no tiene movimientos de inventario." />
          ) : items.length > 0 ? (
            <table className="data-table min-w-[900px]">
              <thead className="data-table__head">
                <tr className="data-table__row">
                  <th className="data-table__cell data-table__cell--heading">Fecha</th>
                  <th className="data-table__cell data-table__cell--heading">Tipo</th>
                  <th className="data-table__cell data-table__cell--heading">Cantidad</th>
                  <th className="data-table__cell data-table__cell--heading">Costo unit.</th>
                  <th className="data-table__cell data-table__cell--heading">Costo total</th>
                  <th className="data-table__cell data-table__cell--heading">Saldo</th>
                  <th className="data-table__cell data-table__cell--heading">Saldo valorado</th>
                  <th className="data-table__cell data-table__cell--heading">Motivo</th>
                </tr>
              </thead>
              <tbody className="data-table__body">
                {items.map((movement) => {
                  const direction = movementDirection(movement);
                  return (
                    <tr key={movement.id} className="data-table__row">
                      <td className="whitespace-nowrap data-table__cell">{formatDateTime(movement.createdAt)}</td>
                      <td className="data-table__cell">{movementLabel(movement.movementType)}</td>
                      <td data-testid="kardex-qty" className={`data-table__cell ${movementDirectionClass(direction)}`}>
                        {formatSignedQuantity(movement.quantity, direction)}
                      </td>
                      <td className="data-table__cell">{formatMoney(movement.unitCost)}</td>
                      <td className="data-table__cell">{formatMoney(movement.totalCost)}</td>
                      <td className="data-table__cell">
                        {formatNumber(movement.stockBefore, 3)} → {formatNumber(movement.stockAfter, 3)}
                      </td>
                      <td className="data-table__cell">{formatMoney(movement.valuedBalance)}</td>
                      <td className="text-muted-foreground data-table__cell">{movement.reason ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
          <Pagination page={page} pageSize={KARDEX_PAGE_SIZE} total={total} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}

/** Tarjeta compacta de un indicador del producto. */
function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
