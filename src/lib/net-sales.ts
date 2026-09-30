/**
 * Reglas puras para normalizar y presentar las ventas netas del dashboard.
 * Mantiene compatibilidad con respuestas del backend anteriores al desglose.
 */

import type {
  DashboardSalesPeriod,
  DashboardSalesReturns,
  DashboardSummary,
} from "@/lib/api/dashboard";
import { formatMoney } from "@/lib/utils";

/** Desglose de un periodo de ventas listo para consumir en la interfaz. */
export type SalesBreakdown = {
  gross: number;
  returns: number;
  returnsCount: number;
  net: number;
  tx: number;
};

const TX_KEYS: Record<DashboardSalesPeriod, "todayTx" | "weekTx" | "monthTx"> = {
  today: "todayTx",
  week: "weekTx",
  month: "monthTx",
  prevMonth: "monthTx",
};

const RETURN_COUNT_KEYS: Record<DashboardSalesPeriod, keyof DashboardSalesReturns> = {
  today: "todayCount",
  week: "weekCount",
  month: "monthCount",
  prevMonth: "prevMonthCount",
};

/**
 * Obtiene el valor de transacciones correspondiente al periodo solicitado.
 * El periodo anterior no expone una cantidad de tickets en el contrato actual.
 *
 * @param sales - Resumen de ventas recibido del backend
 * @param period - Periodo que se desea consultar
 * @returns Cantidad de ventas del periodo o cero para el mes anterior
 */
function transactionCount(
  sales: DashboardSummary["sales"],
  period: DashboardSalesPeriod,
): number {
  return period === "prevMonth" ? 0 : sales[TX_KEYS[period]];
}

/**
 * Normaliza el desglose de ventas y conserva el comportamiento del backend viejo.
 * Cuando falta el desglose, el valor legado se interpreta como neto y bruto, sin devoluciones.
 *
 * @param sales - Resumen de ventas recibido del backend
 * @param period - Periodo que se desea consultar
 * @returns Bruto, devoluciones, neto y tickets normalizados
 */
export function salesBreakdown(
  sales: DashboardSummary["sales"],
  period: DashboardSalesPeriod,
): SalesBreakdown {
  const legacyValue = sales[period];
  const gross = sales.gross?.[period] ?? legacyValue;
  const returns = sales.returns?.[period] ?? 0;
  const net = sales.net?.[period] ?? legacyValue;
  const returnsCount = sales.returns?.[RETURN_COUNT_KEYS[period]] ?? 0;

  return {
    gross,
    returns,
    returnsCount,
    net,
    tx: transactionCount(sales, period),
  };
}

/**
 * Indica si el periodo tiene devoluciones monetarias que deban destacarse.
 *
 * @param breakdown - Desglose normalizado de ventas
 * @returns `true` cuando el monto de devoluciones es positivo
 */
export function hasReturns(breakdown: Pick<SalesBreakdown, "returns">): boolean {
  return breakdown.returns > 0;
}

/**
 * Genera el texto secundario para explicar el bruto y las devoluciones.
 *
 * @param breakdown - Desglose normalizado de ventas
 * @returns Texto con bruto y devoluciones, o `undefined` si no hay devoluciones
 */
export function returnsHint(
  breakdown: Pick<SalesBreakdown, "gross" | "returns" | "returnsCount">,
): string | undefined {
  if (!hasReturns(breakdown)) return undefined;
  return `Bruto ${formatMoney(breakdown.gross)} · Devoluciones ${formatMoney(
    -Math.abs(breakdown.returns),
  )} (${breakdown.returnsCount})`;
}
