import { api } from "@/lib/api";

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
    byOrderType: Array<{ orderType: string; total: number; count: number }>;
    topProducts: Array<{
      productId: string;
      code: string;
      description: string;
      quantity: number;
      amount: number;
    }>;
  };
  inventory: {
    totalValue: number;
    activeProducts: number;
    belowMin: number;
    openAlerts: number;
    movementsToday: Array<{ movementType: string; count: number; quantity: number }>;
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

export const dashboardApi = {
  summary: () => api.get<DashboardSummary>("/dashboard/summary"),
};
