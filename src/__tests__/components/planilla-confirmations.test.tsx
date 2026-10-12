import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CorridasContent from "@/app/(admin)/planilla/corridas/corridas-content";
import AguinaldoContent from "@/app/(admin)/planilla/aguinaldo/aguinaldo-content";
import LiquidacionesContent from "@/app/(admin)/planilla/liquidaciones/liquidaciones-content";
import PeriodosContent from "@/app/(admin)/planilla/periodos/periodos-content";
import VacacionesContent from "@/app/(admin)/planilla/vacaciones/vacaciones-content";
import { ApiError } from "@/lib/api";
import { usePayrollPeriods, usePayrollRun, usePayrollRuns, useUpdatePayrollDetail } from "@/hooks/use-payroll";
import { useAguinaldoRun, useAguinaldoRuns } from "@/hooks/use-aguinaldo";
import { useTerminations } from "@/hooks/use-terminations";
import { useLeaveRequests, useVacationBalances } from "@/hooks/use-vacation";

jest.mock("@/hooks/use-payroll", () => ({
  usePayrollPeriods: jest.fn(),
  usePayrollRun: jest.fn(),
  usePayrollRuns: jest.fn(),
  useUpdatePayrollDetail: jest.fn(),
}));
jest.mock("@/hooks/use-aguinaldo", () => ({ useAguinaldoRun: jest.fn(), useAguinaldoRuns: jest.fn() }));
jest.mock("@/hooks/use-terminations", () => ({ useTerminations: jest.fn() }));
jest.mock("@/hooks/use-vacation", () => ({ useLeaveRequests: jest.fn(), useVacationBalances: jest.fn() }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const payrollRunsMock = usePayrollRuns as jest.Mock;
const payrollPeriodsMock = usePayrollPeriods as jest.Mock;
const payrollRunMock = usePayrollRun as jest.Mock;
const updateDetailMock = useUpdatePayrollDetail as jest.Mock;
const aguinaldoRunsMock = useAguinaldoRuns as jest.Mock;
const aguinaldoRunMock = useAguinaldoRun as jest.Mock;
const terminationsMock = useTerminations as jest.Mock;
const leaveRequestsMock = useLeaveRequests as jest.Mock;
const vacationBalancesMock = useVacationBalances as jest.Mock;

const payrollRow = {
  id: "run-1",
  periodName: "Septiembre 2026 (quincena 2)",
  name: "Planilla septiembre 2026",
  status: "EN_REVISION",
  employeeCount: 2,
  totalGross: "1000",
  totalDeductions: "100",
  totalNet: "900",
};

function configurePlanilla() {
  const approveRun = jest.fn().mockResolvedValue(payrollRow);
  const payRun = jest.fn().mockResolvedValue(payrollRow);
  const voidRun = jest.fn().mockResolvedValue(payrollRow);
  payrollRunsMock.mockReturnValue({
    items: [payrollRow], total: 1, pageSize: 20, loading: false, isError: false, error: null,
    refresh: jest.fn(), generateRun: jest.fn(), approveRun, payRun, voidRun, submitting: false,
  });
  payrollPeriodsMock.mockReturnValue({ items: [], isError: false });
  payrollRunMock.mockReturnValue({ run: null, loading: false, isError: false, error: null, refresh: jest.fn() });
  updateDetailMock.mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
  return { approveRun, payRun, voidRun };
}

describe("confirmaciones financieras de planilla", () => {
  beforeEach(() => jest.clearAllMocks());

  it("no llama aprobar antes de confirmar y cancelar nunca llama a la API", async () => {
    const user = userEvent.setup();
    const { approveRun } = configurePlanilla();
    render(<CorridasContent />);

    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    expect(approveRun).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(approveRun).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Aprobar" }));
    await waitFor(() => expect(approveRun).toHaveBeenCalledWith("run-1"));
  });

  it("muestra el error de la API dentro del diálogo y permite reintentar", async () => {
    const user = userEvent.setup();
    const { approveRun } = configurePlanilla();
    approveRun.mockRejectedValueOnce(new ApiError("La corrida ya fue aprobada", 409));
    render(<CorridasContent />);

    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Aprobar" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("La corrida ya fue aprobada"));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it.each([
    ["Aprobar", "EN_REVISION", "approve"],
    ["Pagar", "APROBADA", "pay"],
    ["Anular", "EN_REVISION", "voidRun"],
  ] as const)("no ejecuta %s aguinaldo hasta confirmar", async (actionLabel, status, action) => {
    const user = userEvent.setup();
    const approve = jest.fn().mockResolvedValue({});
    const pay = jest.fn().mockResolvedValue({});
    const voidRun = jest.fn().mockResolvedValue({});
    aguinaldoRunsMock.mockReturnValue({ items: [{ id: "agu-1", year: 2026, paymentDate: "2026-12-12", status, totalAmount: "500", detailsCount: 1 }], total: 1, pageSize: 20, loading: false, isError: false, error: null, refresh: jest.fn(), generate: jest.fn(), approve, pay, voidRun, submitting: false });
    aguinaldoRunMock.mockReturnValue({ data: null, isLoading: false, isError: false, error: null, refetch: jest.fn() });
    render(<AguinaldoContent />);

    await user.click(screen.getByRole("button", { name: actionLabel }));
    const mutation = action === "approve" ? approve : action === "pay" ? pay : voidRun;
    expect(mutation).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(mutation).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: actionLabel }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: actionLabel }));
    await waitFor(() => expect(mutation).toHaveBeenCalledWith("agu-1"));
  });

  it("requiere confirmación antes de aprobar una liquidación", async () => {
    const user = userEvent.setup();
    const approve = jest.fn().mockResolvedValue({});
    terminationsMock.mockReturnValue({ items: [{ id: "term-1", employeeName: "Ana Pérez", terminationDate: "2026-10-01", reason: "RENUNCIA_VOLUNTARIA", status: "EN_REVISION", indemnizacionAmount: "0", totalSettlement: "100" }], total: 1, pageSize: 20, employees: [], loading: false, isError: false, error: null, refresh: jest.fn(), employeesError: false, create: jest.fn(), approve, pay: jest.fn(), voidTermination: jest.fn(), submitting: false });
    render(<LiquidacionesContent />);

    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    expect(approve).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Ana Pérez");
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(approve).not.toHaveBeenCalled();
  });

  it.each([
    ["Pagar", "APROBADA", "pay"],
    ["Anular", "EN_REVISION", "voidTermination"],
  ] as const)("no ejecuta %s una liquidación hasta confirmar", async (actionLabel, status, action) => {
    const user = userEvent.setup();
    const pay = jest.fn().mockResolvedValue({});
    const voidTermination = jest.fn().mockResolvedValue({});
    terminationsMock.mockReturnValue({
      items: [{ id: "term-1", employeeName: "Ana Pérez", terminationDate: "2026-10-01", reason: "RENUNCIA_VOLUNTARIA", status, indemnizacionAmount: "0", totalSettlement: "100" }],
      total: 1, pageSize: 20, employees: [], loading: false, isError: false, error: null,
      refresh: jest.fn(), employeesError: false, create: jest.fn(), approve: jest.fn(), pay, voidTermination, submitting: false,
    });
    render(<LiquidacionesContent />);

    await user.click(screen.getByRole("button", { name: actionLabel }));
    const mutation = action === "pay" ? pay : voidTermination;
    expect(mutation).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(mutation).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: actionLabel }));
    if (action === "voidTermination") {
      const reason = within(screen.getByRole("alertdialog")).getByRole("textbox", { name: "Motivo de anulación" });
      expect(reason).toHaveProperty("maxLength", 500);
      await user.type(reason, "Corrección administrativa");
    }
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: actionLabel }));
    await waitFor(() => {
      if (action === "pay") expect(pay).toHaveBeenCalledWith("term-1");
      else expect(voidTermination).toHaveBeenCalledWith({ id: "term-1", reason: "Corrección administrativa" });
    });
  });

  it("confirma el cierre de un período antes de llamar a la API", async () => {
    const user = userEvent.setup();
    const closePeriod = jest.fn().mockResolvedValue({});
    payrollPeriodsMock.mockReturnValue({ items: [{ id: "period-1", name: "Septiembre 2026", periodType: "MENSUAL", startDate: "2026-09-01", endDate: "2026-09-30", paymentDate: "2026-10-01", isClosed: false, runsCount: 0 }], total: 1, loading: false, isError: false, error: null, refresh: jest.fn(), createPeriod: jest.fn(), updatePeriod: jest.fn(), closePeriod, reopenPeriod: jest.fn(), submitting: false });
    render(<PeriodosContent />);

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(closePeriod).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(closePeriod).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cerrar período" }));
    await waitFor(() => expect(closePeriod).toHaveBeenCalledWith("period-1"));
  });

  it("no reabre un período hasta confirmar", async () => {
    const user = userEvent.setup();
    const reopenPeriod = jest.fn().mockResolvedValue({});
    payrollPeriodsMock.mockReturnValue({ items: [{ id: "period-closed", name: "Agosto 2026", periodType: "MENSUAL", startDate: "2026-08-01", endDate: "2026-08-31", paymentDate: "2026-09-01", isClosed: true, runsCount: 1 }], total: 1, loading: false, isError: false, error: null, refresh: jest.fn(), createPeriod: jest.fn(), updatePeriod: jest.fn(), closePeriod: jest.fn(), reopenPeriod, submitting: false });
    render(<PeriodosContent />);

    await user.click(screen.getByRole("button", { name: "Reabrir" }));
    expect(reopenPeriod).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(reopenPeriod).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Reabrir" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Reabrir período" }));
    await waitFor(() => expect(reopenPeriod).toHaveBeenCalledWith("period-closed"));
  });

  it("confirma la aprobación de vacaciones antes de descontar el saldo", async () => {
    const user = userEvent.setup();
    const approve = jest.fn().mockResolvedValue({});
    vacationBalancesMock.mockReturnValue({ items: [], loading: false, isError: false, error: null, refresh: jest.fn(), ensure: jest.fn(), ensuring: false });
    leaveRequestsMock.mockReturnValue({
      items: [{ id: "leave-1", employeeName: "Ana Pérez", leaveTypeName: "Vacaciones", startDate: "2026-10-10", endDate: "2026-10-12", daysRequested: 3, status: "PENDIENTE" }],
      total: 1, pageSize: 20, leaveTypes: [], employees: [], catalogsError: false, loading: false, isError: false, error: null, refresh: jest.fn(), create: jest.fn(), approve, reject: jest.fn(), submitting: false,
    });
    render(<VacacionesContent />);

    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    expect(approve).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(approve).not.toHaveBeenCalled();
  });

  it("no rechaza una solicitud de vacaciones hasta confirmar", async () => {
    const user = userEvent.setup();
    const reject = jest.fn().mockResolvedValue({});
    vacationBalancesMock.mockReturnValue({ items: [], loading: false, isError: false, error: null, refresh: jest.fn(), ensure: jest.fn(), ensuring: false });
    leaveRequestsMock.mockReturnValue({
      items: [{ id: "leave-reject", employeeName: "Ana Pérez", leaveTypeName: "Vacaciones", startDate: "2026-10-10", endDate: "2026-10-12", daysRequested: 3, status: "PENDIENTE" }],
      total: 1, pageSize: 20, leaveTypes: [], employees: [], catalogsError: false, loading: false, isError: false, error: null, refresh: jest.fn(), create: jest.fn(), approve: jest.fn(), reject, submitting: false,
    });
    render(<VacacionesContent />);

    await user.click(screen.getByRole("button", { name: "Rechazar" }));
    expect(reject).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(reject).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Rechazar" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Rechazar" }));
    await waitFor(() => expect(reject).toHaveBeenCalledWith("leave-reject"));
  });
});
