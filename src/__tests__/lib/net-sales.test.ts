import type { DashboardSummary } from "@/lib/api/dashboard";
import { formatMoney } from "@/lib/utils";
import { hasReturns, returnsHint, salesBreakdown } from "@/lib/net-sales";

const baseSales: DashboardSummary["sales"] = {
  today: 80,
  todayTx: 4,
  week: 180,
  weekTx: 9,
  month: 300,
  monthTx: 15,
  prevMonth: 250,
  monthOverMonthPct: 20,
  avgTicket: 20,
  byOrderType: [],
  topProducts: [],
};

describe("reglas de ventas netas", () => {
  it("normaliza el desglose nuevo y conserva la cantidad de tickets", () => {
    const sales: DashboardSummary["sales"] = {
      ...baseSales,
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
    };

    expect(salesBreakdown(sales, "month")).toEqual({
      gross: 400,
      returns: 100,
      returnsCount: 5,
      net: 300,
      tx: 15,
    });
    expect(hasReturns(salesBreakdown(sales, "month"))).toBe(true);
  });

  it("usa el valor legado como bruto y neto cuando falta el desglose", () => {
    expect(salesBreakdown(baseSales, "today")).toEqual({
      gross: 80,
      returns: 0,
      returnsCount: 0,
      net: 80,
      tx: 4,
    });
    expect(hasReturns(salesBreakdown(baseSales, "today"))).toBe(false);
  });

  it("conserva los montos netos negativos", () => {
    const sales = {
      ...baseSales,
      today: -10,
      net: { today: -10, week: 180, month: 300, prevMonth: 250 },
    };

    expect(salesBreakdown(sales, "today").net).toBe(-10);
    expect(formatMoney(salesBreakdown(sales, "today").net)).toBe("-$10.00");
  });

  it("genera la ayuda de devoluciones solo cuando existen", () => {
    expect(returnsHint(salesBreakdown(baseSales, "today"))).toBeUndefined();
    expect(returnsHint({ gross: 120, returns: 20, returnsCount: 2 })).toBe(
      "Bruto $120.00 · Devoluciones -$20.00 (2)",
    );
  });
});
