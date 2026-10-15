import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import VacacionesContent from "@/app/(admin)/planilla/vacaciones/vacaciones-content";
import { ApiError } from "@/lib/api";
import { employeesApi } from "@/lib/api/employees";
import { vacationApi } from "@/lib/api/vacation";

jest.mock("@/lib/api/employees", () => ({
  employeesApi: { list: jest.fn() },
}));

jest.mock("@/lib/api/vacation", () => ({
  vacationApi: {
    listBalances: jest.fn(),
    listLeaveRequests: jest.fn(),
    listLeaveTypes: jest.fn(),
    createLeaveRequest: jest.fn(),
    approveLeaveRequest: jest.fn(),
    rejectLeaveRequest: jest.fn(),
  },
}));

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const listLeaveRequestsMock = vacationApi.listLeaveRequests as jest.Mock;
const approveLeaveRequestMock = vacationApi.approveLeaveRequest as jest.Mock;

const pendingRequest = {
  id: "leave-1",
  employeeId: "employee-1",
  employeeName: "Ana Pérez",
  leaveTypeId: "type-1",
  leaveTypeName: "Vacaciones",
  leaveTypeCategory: "VACACIONES",
  leaveTypeIsPaid: true,
  startDate: "2026-10-10",
  endDate: "2026-10-12",
  daysRequested: 3,
  halfDay: false,
  status: "PENDIENTE" as const,
  requestedAt: "2026-10-01T12:00:00.000Z",
};

/** Renderiza el componente con un cliente aislado para observar sus refetches. */
function renderVacaciones() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <VacacionesContent />
    </QueryClientProvider>,
  );
}

describe("actualización de solicitudes de vacaciones", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (employeesApi.list as jest.Mock).mockResolvedValue({ items: [], total: 0, take: 200, skip: 0 });
    (vacationApi.listBalances as jest.Mock).mockResolvedValue([]);
    (vacationApi.listLeaveTypes as jest.Mock).mockResolvedValue([]);
    listLeaveRequestsMock
      .mockResolvedValueOnce({ items: [pendingRequest], total: 1, take: 20, skip: 0 })
      .mockResolvedValue({
        items: [{ ...pendingRequest, status: "APROBADA" as const }],
        total: 1,
        take: 20,
        skip: 0,
      });
    approveLeaveRequestMock.mockRejectedValue(new ApiError("La solicitud ya fue revisada", 409));
  });

  it("refresca la solicitud tras un 409 al aprobar y muestra el error", async () => {
    const user = userEvent.setup();
    renderVacaciones();

    await user.click(await screen.findByRole("button", { name: "Aprobar" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Aprobar" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("La solicitud ya fue revisada"));
    await waitFor(() => expect(listLeaveRequestsMock).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    const requestRow = screen
      .getAllByText(pendingRequest.employeeName)
      .map((employee) => employee.closest("tr"))
      .find((row): row is HTMLTableRowElement => row !== null);
    expect(requestRow).not.toBeNull();
    expect(within(requestRow as HTMLTableRowElement).getByText("Aprobada")).toBeInTheDocument();
  });
});
