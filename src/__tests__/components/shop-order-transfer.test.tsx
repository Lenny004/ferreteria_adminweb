import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PedidoDetallePage from "@/app/(store)/tienda/pedidos/[id]/page";
import { shopOrdersApi } from "@/lib/api/shop-orders";
import { useShopSession } from "@/hooks/use-shop-session";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "order-1" }),
}));

jest.mock("@/hooks/use-shop-session", () => ({ useShopSession: jest.fn() }));

jest.mock("@/lib/api/shop-orders", () => ({
  shopOrdersApi: {
    getOrder: jest.fn(),
    submitTransferReference: jest.fn(),
  },
}));

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const useQueryMock = useQuery as jest.Mock;
const useMutationMock = useMutation as jest.Mock;
const submitReferenceMock = shopOrdersApi.submitTransferReference as jest.Mock;

const order = {
  id: "order-1",
  shopCustomerId: "customer-1",
  status: "CONFIRMADA" as const,
  subtotal: "100",
  taxAmount: "13",
  total: "113",
  deliveryType: "RETIRO_TIENDA" as const,
  paymentStatus: "PENDIENTE" as const,
  paymentMethod: "TRANSFERENCIA" as const,
  createdAt: "2026-10-03T12:00:00.000Z",
  updatedAt: "2026-10-03T12:00:00.000Z",
  lines: [],
  payments: [],
};

describe("referencia de transferencia de tienda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useShopSession as jest.Mock).mockReturnValue({ status: "authenticated" });
    useQueryMock.mockReturnValue({ data: order, isLoading: false, isError: false });
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: jest.fn() });
    submitReferenceMock.mockResolvedValue({ ...order, paymentStatus: "EN_VERIFICACION" });
    useMutationMock.mockImplementation(({ mutationFn, onSuccess, onError }) => ({
      isPending: false,
      mutate: async (variables: unknown) => {
        try {
          const result = await mutationFn(variables);
          onSuccess?.(result, variables);
        } catch (error) {
          onError?.(error, variables);
        }
      },
    }));
  });

  it("muestra el formulario, valida referencia vacía y usa submitTransferReference", async () => {
    const user = userEvent.setup();
    render(<PedidoDetallePage />);

    const reference = screen.getByLabelText("Referencia de transferencia *");
    expect(reference).toBeRequired();
    await user.click(screen.getByRole("button", { name: "Enviar referencia" }));
    expect(submitReferenceMock).not.toHaveBeenCalled();

    await user.type(reference, "TRF-123");
    await user.click(screen.getByRole("button", { name: "Enviar referencia" }));

    await waitFor(() => expect(submitReferenceMock).toHaveBeenCalledWith("order-1", {
      reference: "TRF-123",
      notes: undefined,
    }));
    expect(screen.queryByRole("button", { name: "Pagar" })).not.toBeInTheDocument();
  });

  it("etiqueta y muestra la referencia cuando el pago está en verificación", () => {
    useQueryMock.mockReturnValue({
      data: {
        ...order,
        paymentStatus: "EN_VERIFICACION",
        payments: [{
          id: "payment-1",
          method: "TRANSFERENCIA",
          amount: "113",
          status: "PENDIENTE",
          customerReference: "TRF-999",
        }],
      },
      isLoading: false,
      isError: false,
    });

    render(<PedidoDetallePage />);

    expect(screen.getAllByText("Pago en verificación").length).toBeGreaterThan(0);
    expect(screen.getByText("Pago pendiente de verificación por la tienda")).toBeInTheDocument();
    expect(screen.getByText(/TRF-999/)).toBeInTheDocument();
    expect(screen.getByText(/NO está pagado/)).toBeInTheDocument();
  });
});

