import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryErrorState } from "@/components/ui/query-error-state";
import BancosRrhhContent from "@/app/(admin)/rrhh/bancos/bancos-content";
import FichaEmpleadoContent from "@/app/(admin)/empleados/[id]/ficha/ficha-content";
import { ApiError } from "@/lib/api";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "employee-1" }),
}));

const useQueryMock = useQuery as jest.Mock;

describe("QueryErrorState", () => {
  it("muestra el mensaje seguro de ApiError y permite reintentar", async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    render(
      <QueryErrorState
        error={new ApiError("El servidor no está disponible", 503)}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron cargar los datos");
    expect(screen.getByRole("alert")).toHaveTextContent("El servidor no está disponible");
    expect(screen.getByRole("alert")).not.toHaveTextContent("stack");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("estados de error representativos del panel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: jest.fn() });
    (useMutation as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });
  });

  it("bancos muestra el error y reintenta la query", async () => {
    const user = userEvent.setup();
    const refetch = jest.fn();
    useQueryMock.mockReturnValue({
      isLoading: false,
      isError: true,
      error: new ApiError("No se pudo consultar bancos", 500),
      refetch,
      data: undefined,
    });

    render(<BancosRrhhContent />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo consultar bancos");
    expect(screen.queryByText("Sin registros")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("ficha de empleado no presenta el detalle vacío cuando falla", async () => {
    const user = userEvent.setup();
    const refetch = jest.fn();
    useQueryMock.mockReturnValue({
      isLoading: false,
      isError: true,
      error: new ApiError("Empleado no disponible", 503),
      refetch,
      data: undefined,
    });

    render(<FichaEmpleadoContent />);

    expect(screen.getByRole("alert")).toHaveTextContent("Empleado no disponible");
    expect(screen.queryByText("Empleado no encontrado.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
