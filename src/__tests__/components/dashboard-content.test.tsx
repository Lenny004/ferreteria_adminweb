import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import type { DashboardSummary } from "@/lib/api/dashboard";
import { formatMoney } from "@/lib/utils";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import DashboardContent from "@/app/(admin)/dashboard/dashboard-content";

jest.mock("@/hooks/use-dashboard", () => ({
  useDashboardSummary: jest.fn(),
}));

jest.mock("recharts", () => {
  function MockChart({ children }: { children?: ReactNode }) {
    return <div>{children}</div>;
  }

  return {
    Bar: () => null,
    BarChart: MockChart,
    CartesianGrid: () => null,
    Legend: () => null,
    ResponsiveContainer: MockChart,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null,
  };
});

const baseSummary: DashboardSummary = {
  generatedAt: "2026-09-30T12:00:00.000Z",
  sales: {
    today: 80,
    todayTx: 4,
    week: 180,
    weekTx: 9,
    month: 300,
    monthTx: 15,
    prevMonth: 250,
    monthOverMonthPct: 20,
    avgTicket: 20,
    byOrderType: [{ orderType: "POS", total: 300, count: 15, returns: 20, returnsCount: 1 }],
    topProducts: [
      {
        productId: "product-1",
        code: "P-1",
        description: "Producto 1",
        quantity: 2,
        amount: 80,
        returnedAmount: 10,
      },
    ],
    gross: { today: 100, week: 240, month: 400, prevMonth: 250 },
    returns: {
      today: 20,
      week: 60,
      month: 100,
      prevMonth: 0,
      todayCount: 1,
      weekCount: 3,
      monthCount: 5,
      prevMonthCount: 0,
    },
    net: { today: 80, week: 180, month: 300, prevMonth: 250 },
    avgTicketGross: 26.67,
    daily: [
      { date: "2026-09-29", gross: 100, returns: 20, net: 80, tx: 4, returnsCount: 1 },
    ],
    byCategory: [
      { familyId: "family-1", code: "FER", name: "Ferretería", gross: 100, returns: 20, net: 80 },
    ],
  },
  inventory: {
    totalValue: 1000,
    activeProducts: 10,
    belowMin: 1,
    openAlerts: 1,
    movementsToday: [],
  },
  purchases: { pendingOrders: 1, monthTotal: 500, monthCount: 2, topSuppliers: [] },
  hr: {
    headcountByContract: [],
    activeEmployees: 5,
    documentsExpiring30d: 0,
    upcomingPayroll: [],
  },
};

const useDashboardSummaryMock = useDashboardSummary as jest.Mock;

describe("DashboardContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDashboardSummaryMock.mockReturnValue({ data: baseSummary, isLoading: false, error: null });
  });

  it("muestra el neto, el bruto y el conteo de devoluciones", () => {
    render(<DashboardContent />);

    const todayLabel = screen.getByText("Ventas netas · Hoy");
    expect(todayLabel).toBeInTheDocument();
    expect(within(todayLabel.closest("div") as HTMLElement).getByText(formatMoney(80))).toBeInTheDocument();
    expect(screen.getByText(/4 tickets \u00b7 Bruto \$100\.00 \u00b7 Devoluciones -\$20\.00 \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/vs mes ant\. \(neto\)/)).toBeInTheDocument();
  });

  it("renderiza las tarjetas de siete días y categorías", () => {
    render(<DashboardContent />);

    expect(screen.getByText("Ventas últimos 7 días")).toBeInTheDocument();
    expect(screen.getByText("Ventas por categoría (mes)")).toBeInTheDocument();
    expect(screen.getByText(/FER — Ferretería/)).toBeInTheDocument();
    expect(screen.getByText("Top productos (mes, neto)")).toBeInTheDocument();
  });

  it("no muestra el detalle de devoluciones cuando el monto es cero", () => {
    const summaryWithoutReturns: DashboardSummary = {
      ...baseSummary,
      sales: {
        ...baseSummary.sales,
        byOrderType: [{ orderType: "POS", total: 300, count: 15, returns: 0, returnsCount: 0 }],
        returns: {
          today: 0,
          week: 0,
          month: 0,
          prevMonth: 0,
          todayCount: 0,
          weekCount: 0,
          monthCount: 0,
          prevMonthCount: 0,
        },
        byCategory: [
          { familyId: "family-1", code: "FER", name: "Ferretería", gross: 80, returns: 0, net: 80 },
        ],
      },
    };
    useDashboardSummaryMock.mockReturnValue({
      data: summaryWithoutReturns,
      isLoading: false,
      error: null,
    });

    render(<DashboardContent />);

    expect(screen.queryByText(/Devoluciones -\$/)).not.toBeInTheDocument();
  });

  it("tolera un resumen del backend viejo sin desglose", () => {
    const legacySummary: DashboardSummary = {
      ...baseSummary,
      sales: {
        ...baseSummary.sales,
        gross: undefined,
        returns: undefined,
        net: undefined,
        avgTicketGross: undefined,
        daily: undefined,
        byCategory: undefined,
      },
    };
    useDashboardSummaryMock.mockReturnValue({ data: legacySummary, isLoading: false, error: null });

    render(<DashboardContent />);

    expect(screen.getByText(formatMoney(80))).toBeInTheDocument();
    expect(screen.queryByText("Ventas últimos 7 días")).not.toBeInTheDocument();
    expect(screen.queryByText(/Ventas por categor.a \(mes\)/)).not.toBeInTheDocument();
  });
});
