/** Pruebas del payload de alta y edición de empleados, incluido el PIN opcional. */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import EmpleadosContent from "@/app/(admin)/empleados/empleados-content";
import { useDepartments, useEmployees, usePositions } from "@/hooks/use-employees";

jest.mock("@/hooks/use-employees", () => ({
  useDepartments: jest.fn(),
  useEmployees: jest.fn(),
  usePositions: jest.fn(),
}));

const mockedUseDepartments = jest.mocked(useDepartments);
const mockedUseEmployees = jest.mocked(useEmployees);
const mockedUsePositions = jest.mocked(usePositions);

const employee = {
  id: "employee-1",
  firstName: "Ana",
  lastName: "Pérez",
  dui: "01234567-8",
  positionId: null,
  departmentId: null,
  hireDate: "2024-01-15T00:00:00.000Z",
  baseSalary: "500",
  contractType: "PLAZO_FIJO",
  salaryType: "QUINCENAL",
  phone: null,
  email: null,
  canSell: false,
  canCashier: false,
  isActive: true,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-01-15T00:00:00.000Z",
  position: null,
  department: null,
};

describe("EmpleadosContent", () => {
  beforeEach(() => {
    mockedUseDepartments.mockReturnValue(
      { data: [], isError: false } as unknown as ReturnType<typeof useDepartments>,
    );
    mockedUsePositions.mockReturnValue(
      { data: [], isError: false } as unknown as ReturnType<typeof usePositions>,
    );
  });

  it("omite el PIN vacío al editar y lo incluye cuando se captura", async () => {
    const user = userEvent.setup();
    const updateEmployee = jest.fn().mockResolvedValue(employee);
    const createEmployee = jest.fn().mockResolvedValue(employee);
    mockedUseEmployees.mockReturnValue({
      items: [employee],
      total: 1,
      pageSize: 20,
      loading: false,
      isError: false,
      error: null,
      refresh: jest.fn(),
      createEmployee,
      updateEmployee,
      submitting: false,
    });

    render(<EmpleadosContent />);

    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(updateEmployee).toHaveBeenCalledWith(
      "employee-1",
      expect.not.objectContaining({ pin: expect.anything() }),
    );

    await user.click(screen.getByRole("button", { name: "Nuevo empleado" }));
    await user.type(screen.getByLabelText("Nombre *"), "Luis");
    await user.type(screen.getByLabelText("Apellido *"), "Gómez");
    await user.type(screen.getByLabelText("PIN caja (opcional)"), "1234");
    fireEvent.submit(screen.getByRole("button", { name: "Guardar" }).closest("form")!);

    expect(createEmployee).toHaveBeenCalledWith(expect.objectContaining({ pin: "1234" }));
  });
});
