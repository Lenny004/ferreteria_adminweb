import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PedidosTiendaContent from "@/app/(admin)/pedidos-tienda/pedidos-tienda-content";
import { ApiError } from "@/lib/api";
import { adminShopOrdersApi } from "@/lib/api/admin-shop-orders";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock("@/lib/api/admin-shop-orders", () => ({
  adminShopOrdersApi: {
    list: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    confirmPayment: jest.fn(),
  },
}));

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const useQueryMock = useQuery as jest.Mock;
const useMutationMock = useMutation as jest.Mock;
const confirmPaymentMock = adminShopOrdersApi.confirmPayment as jest.Mock;
const invalidateQueriesMock = jest.fn();

const pendingOrder = {
  id: "order-pending",
  status: "CONFIRMADA" as const,
  subtotal: "100",
  taxAmount: "13",
  total: "113",
  paymentStatus: "EN_VERIFICACION" as const,
  paymentMethod: "TRANSFERENCIA" as const,
  createdAt: "2026-10-03T12:00:00.000Z",
  updatedAt: "2026-10-03T12:00:00.000Z",
  shopCustomer: { fullName: "Ana Pérez", email: "ana@example.com", phone: "7000-0000" },
  payments: [{
    id: "payment-1",
    method: "TRANSFERENCIA" as const,
    amount: "113",
    status: "PENDIENTE" as const,
    customerReference: "TRF-NUEVA",
    customerReferenceAt: "2026-10-03T11:30:00.000Z",
  }, {
    id: "payment-2",
    method: "TRANSFERENCIA" as const,
    amount: "113",
    status: "PENDIENTE" as const,
    customerReference: "TRF-ANTIGUA",
    customerReferenceAt: "2026-10-02T11:30:00.000Z",
  }],
};

function configureQuery(data: { items: unknown[]; total: number } = { items: [pendingOrder], total: 1 }) {
  const refetch = jest.fn();
  useQueryMock.mockReturnValue({ data, isLoading: false, isError: false, refetch });
  return refetch;
}

describe("PedidosTiendaContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: invalidateQueriesMock });
    configureQuery();
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
    confirmPaymentMock.mockResolvedValue(pendingOrder);
    (adminShopOrdersApi.update as jest.Mock).mockResolvedValue(pendingOrder);
  });

  it("muestra pedidos, estados de pago y referencia del cliente", () => {
    render(<PedidosTiendaContent />);

    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Pago en verificación")).toBeInTheDocument();
    expect(screen.getByText("TRF-NUEVA")).toBeInTheDocument();
    expect(screen.queryByText("TRF-ANTIGUA")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar pago" })).toBeInTheDocument();
  });

  it("muestra QueryErrorState cuando falla el listado", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError("No se pudo cargar pedidos", 503),
      refetch: jest.fn(),
    });

    render(<PedidosTiendaContent />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar pedidos");
  });

  it("confirma el pago con la API desde el modal", async () => {
    const user = userEvent.setup();
    render(<PedidosTiendaContent />);

    await user.click(screen.getByRole("button", { name: "Confirmar pago" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("TRF-NUEVA");
    expect(screen.getByRole("dialog")).toHaveTextContent("Fecha/hora de la referencia:");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar pago" }));

    await waitFor(() => expect(confirmPaymentMock).toHaveBeenCalledWith("order-pending", expect.objectContaining({
      method: "TRANSFERENCIA",
      expectedCustomerReference: "TRF-NUEVA",
      expectedCustomerReferenceAt: "2026-10-03T11:30:00.000Z",
    })));
  });

  it("envía null cuando el pago pendiente no tiene referencia", async () => {
    const user = userEvent.setup();
    configureQuery({
      items: [{
        ...pendingOrder,
        payments: [{
          ...pendingOrder.payments[0],
          customerReference: null,
          customerReferenceAt: null,
        }],
      }],
      total: 1,
    });
    render(<PedidosTiendaContent />);

    await user.click(screen.getByRole("button", { name: "Confirmar pago" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar pago" }));

    await waitFor(() => expect(confirmPaymentMock).toHaveBeenCalledWith("order-pending", expect.objectContaining({
      expectedCustomerReference: null,
      expectedCustomerReferenceAt: null,
    })));
  });

  it("muestra el mensaje del servidor y refresca ante un 409", async () => {
    const user = userEvent.setup();
    const refetch = configureQuery();
    confirmPaymentMock.mockRejectedValue(new ApiError("El pedido ya fue pagado", 409));
    render(<PedidosTiendaContent />);

    await user.click(screen.getByRole("button", { name: "Confirmar pago" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar pago" }));

    const { toast } = jest.requireMock("sonner") as { toast: { error: jest.Mock } };
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("El pedido ya fue pagado"));
    expect(refetch).toHaveBeenCalled();
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["admin-shop-orders"] });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("muestra que la cancelación devuelve stock al inventario", async () => {
    const user = userEvent.setup();
    render(<PedidosTiendaContent />);

    await user.click(within(screen.getByRole("table")).getByRole("button", { name: "Cancelar pedido" }));

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Se cancelará el pedido y las unidades vendidas volverán al inventario",
    );
  });

  it("muestra el aviso y exige una nota al cancelar un pedido con pago en verificación", async () => {
    const user = userEvent.setup();
    render(<PedidosTiendaContent />);

    await user.click(within(screen.getByRole("table")).getByRole("button", { name: "Cancelar pedido" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(
      "Este pedido tiene un pago en verificación. Revisa la referencia del cliente antes de cancelar e indica el motivo.",
    );
    expect(within(dialog).getByRole("textbox", { name: "Nota de cancelación" })).toBeRequired();
    expect(within(dialog).getByRole("button", { name: "Cancelar pedido" })).toBeDisabled();
  });

  it("envía la nota de cancelación junto con las notas administrativas existentes", async () => {
    const user = userEvent.setup();
    configureQuery({
      items: [{ ...pendingOrder, adminNotes: "Nota administrativa existente" }],
      total: 1,
    });
    render(<PedidosTiendaContent />);

    await user.click(within(screen.getByRole("table")).getByRole("button", { name: "Cancelar pedido" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByRole("textbox", { name: "Nota de cancelación" }), "Cliente solicitó cancelar");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar pedido" }));

    await waitFor(() => expect(adminShopOrdersApi.update).toHaveBeenCalledWith("order-pending", {
      status: "CANCELADA",
      adminNotes: "Nota administrativa existente\nCancelación con pago en verificación: Cliente solicitó cancelar",
    }));
  });

  it("mantiene la cancelación sin notas para un pedido sin pago en verificación", async () => {
    const user = userEvent.setup();
    configureQuery({
      items: [{ ...pendingOrder, status: "PENDIENTE" as const, paymentStatus: "PENDIENTE" as const }],
      total: 1,
    });
    render(<PedidosTiendaContent />);

    await user.click(within(screen.getByRole("table")).getByRole("button", { name: "Cancelar pedido" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("textbox", { name: "Nota de cancelación" })).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar pedido" }));

    await waitFor(() => expect(adminShopOrdersApi.update).toHaveBeenCalledWith("order-pending", {
      status: "CANCELADA",
    }));
  });

  it("oculta cancelar para pedidos ENTREGADA", () => {
    configureQuery({
      items: [{ ...pendingOrder, id: "order-delivered", status: "ENTREGADA" as const }],
      total: 1,
    });

    render(<PedidosTiendaContent />);

    expect(screen.queryByRole("button", { name: "Cancelar pedido" })).not.toBeInTheDocument();
  });

  it("muestra el mensaje del servidor y refresca ante un 409 al cancelar", async () => {
    const user = userEvent.setup();
    const refetch = configureQuery();
    (adminShopOrdersApi.update as jest.Mock).mockRejectedValue(new ApiError("El pedido ya fue entregado", 409));
    render(<PedidosTiendaContent />);

    await user.click(within(screen.getByRole("table")).getByRole("button", { name: "Cancelar pedido" }));
    await user.type(within(screen.getByRole("dialog")).getByRole("textbox", { name: "Nota de cancelación" }), "Pedido ya no es necesario");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar pedido" }));

    const { toast } = jest.requireMock("sonner") as { toast: { error: jest.Mock } };
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("El pedido ya fue entregado"));
    expect(refetch).toHaveBeenCalled();
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ["admin-shop-orders"] });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("muestra el mensaje del servidor ante un 400 al cancelar un pago en verificación", async () => {
    const user = userEvent.setup();
    (adminShopOrdersApi.update as jest.Mock).mockRejectedValue(
      new ApiError("Indica una nota para cancelar un pedido con pago en verificación", 400),
    );
    render(<PedidosTiendaContent />);

    await user.click(within(screen.getByRole("table")).getByRole("button", { name: "Cancelar pedido" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByRole("textbox", { name: "Nota de cancelación" }), "Referencia no coincide");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar pedido" }));

    const { toast } = jest.requireMock("sonner") as { toast: { error: jest.Mock } };
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(
      "Indica una nota para cancelar un pedido con pago en verificación",
    ));
  });

  it("oculta las acciones de pago y cancelación para PAGADO y CANCELADA", () => {
    configureQuery({
      items: [
        pendingOrder,
        { ...pendingOrder, id: "order-paid", paymentStatus: "PAGADO", status: "CONFIRMADA" },
        { ...pendingOrder, id: "order-cancelled", paymentStatus: "PENDIENTE", status: "CANCELADA" },
      ],
      total: 3,
    });

    render(<PedidosTiendaContent />);

    expect(screen.getAllByRole("button", { name: "Confirmar pago" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Cancelar pedido" })).toHaveLength(1);
  });
});
