/**
 * Dashboard ejecutivo — cliente HTTP hacia `/dashboard`.
 */

import { api } from "@/lib/api";

/** Valores monetarios agregados por periodo del dashboard. */
export type DashboardSalesPeriodValues = {
  today: number;
  week: number;
  month: number;
  prevMonth: number;
};

/** Periodos que el dashboard usa para sus agregados de ventas. */
export type DashboardSalesPeriod = keyof DashboardSalesPeriodValues;

/** Desglose de devoluciones completadas atribuidas a cada periodo. */
export type DashboardSalesReturns = DashboardSalesPeriodValues & {
  todayCount: number;
  weekCount: number;
  monthCount: number;
  prevMonthCount: number;
};

/** Resumen consolidado de ventas, inventario, compras y recursos humanos. */
export type DashboardSummary = {
  generatedAt: string;
  sales: {
    today: number;
    todayTx: number;
    week: number;
    weekTx: number;
    month: number;
    monthTx: number;
    prevMonth: number;
    monthOverMonthPct: number | null;
    avgTicket: number;
    /** Campos nuevos opcionales durante el despliegue gradual del backend de ventas netas. */
    gross?: DashboardSalesPeriodValues;
    returns?: DashboardSalesReturns;
    net?: DashboardSalesPeriodValues;
    avgTicketGross?: number;
    byOrderType: Array<{
      orderType: string;
      total: number;
      count: number;
      gross?: number;
      returns?: number;
      returnsCount?: number;
    }>;
    topProducts: Array<{
      productId: string;
      code: string;
      description: string;
      quantity: number;
      amount: number;
      grossQuantity?: number;
      grossAmount?: number;
      returnedQuantity?: number;
      returnedAmount?: number;
    }>;
    daily?: Array<{
      date: string;
      gross: number;
      returns: number;
      net: number;
      tx: number;
      returnsCount: number;
    }>;
    byCategory?: Array<{
      familyId: string;
      code: string;
      name: string;
      gross: number;
      returns: number;
      net: number;
    }>;
  };
  inventory: {
    totalValue: number;
    activeProducts: number;
    belowMin: number;
    openAlerts: number;
    movementsToday: Array<{
      movementType: string;
      count: number;
      quantity: number;
      direction?: "ENTRADA" | "SALIDA";
    }>;
  };
  purchases: {
    pendingOrders: number;
    monthTotal: number;
    monthCount: number;
    topSuppliers: Array<{
      supplierId: string;
      name: string;
      total: number;
      count: number;
    }>;
  };
  hr: {
    headcountByContract: Array<{ contractType: string; count: number }>;
    activeEmployees: number;
    documentsExpiring30d: number;
    upcomingPayroll: Array<{
      id: string;
      name: string;
      status: string;
      totalNet: number;
      periodName: string;
      paymentDate: string;
    }>;
  };
};

/** KPIs agregados de ventas, inventario, compras y RRHH. */
export const dashboardApi = {
  /** Resumen consolidado del dashboard. */
  summary: () => api.get<DashboardSummary>("/dashboard/summary"),
};
