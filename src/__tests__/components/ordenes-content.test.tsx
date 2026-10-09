import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OrdenesContent from "@/app/(admin)/compras/ordenes/ordenes-content";
import { usePurchaseOrderPickers, usePurchaseOrders } from "@/hooks/use-purchase-orders";

jest.mock("@/hooks/use-purchase-orders", () => ({
  usePurchaseOrderPickers: jest.fn(),
  usePurchaseOrders: jest.fn(),
}));

const usePurchaseOrdersMock = usePurchaseOrders as jest.Mock;
const usePurchaseOrderPickersMock = usePurchaseOrderPickers as jest.Mock;

describe("OrdenesContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePurchaseOrdersMock.mockReturnValue({
      items: [
        {
          id: "order-created",
          supplierId: "supplier-1",
          employeeId: null,
          createdByWebUser: { id: "user-1", username: "mlopez" },
          status: "CONFIRMADA",
          subtotal: "100",
          taxAmount: "13",
          total: "113",
          createdAt: "2026-10-03T12:00:00.000Z",
          supplier: { id: "supplier-1", name: "Proveedor Uno" },
        },
        {
          id: "order-without-creator",
          supplierId: "supplier-2",
          employeeId: null,
          createdByWebUser: null,
          status: "CANCELADA",
          subtotal: "50",
          taxAmount: "6.5",
          total: "56.5",
          createdAt: "2026-10-02T12:00:00.000Z",
          supplier: { id: "supplier-2", name: "Proveedor Dos" },
        },
      ],
      total: 2,
      loading: false,
      isError: false,
      error: null,
      refresh: jest.fn(),
      createOrder: jest.fn(),
      confirmOrder: jest.fn(),
      receiveOrder: jest.fn(),
      cancelOrder: jest.fn(),
      submitting: false,
    });
    usePurchaseOrderPickersMock.mockReturnValue({
      suppliers: [],
      products: [],
      loading: false,
      isError: false,
      error: null,
      refresh: jest.fn(),
    });
  });

  it("muestra el usuario creador de la orden y una raya cuando no existe", () => {
    render(<OrdenesContent />);

    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Creado por" })).toBeInTheDocument();
    expect(within(table).getByText("mlopez")).toBeInTheDocument();
    const rowWithoutCreator = within(table).getByText("Proveedor Dos").closest("tr") as HTMLElement;
    expect(within(rowWithoutCreator).getAllByRole("cell")[1]).toHaveTextContent("—");
  });

  it("no confirma una orden hasta la confirmación explícita y cancelar no llama a la API", async () => {
    const user = userEvent.setup();
    const confirmOrder = jest.fn().mockResolvedValue({});
    usePurchaseOrdersMock.mockReturnValue({
      items: [{
        id: "order-draft",
        supplierId: "supplier-1",
        employeeId: null,
        createdByWebUser: null,
        status: "BORRADOR",
        subtotal: "100",
        taxAmount: "13",
        total: "113",
        createdAt: "2026-10-03T12:00:00.000Z",
        supplier: { id: "supplier-1", name: "Proveedor Uno" },
      }],
      total: 1,
      loading: false,
      isError: false,
      error: null,
      refresh: jest.fn(),
      createOrder: jest.fn(),
      confirmOrder,
      receiveOrder: jest.fn(),
      cancelOrder: jest.fn(),
      submitting: false,
    });

    render(<OrdenesContent />);
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(confirmOrder).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(confirmOrder).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Confirmar orden" }));
    await waitFor(() => expect(confirmOrder).toHaveBeenCalledWith("order-draft"));
  });

  it.each([
    ["Recibir", "Recibir orden", "receiveOrder"],
    ["Cancelar", "Cancelar orden", "cancelOrder"],
  ] as const)("no ejecuta %s hasta confirmar", async (actionLabel, confirmLabel, action) => {
    const user = userEvent.setup();
    const receiveOrder = jest.fn().mockResolvedValue({});
    const cancelOrder = jest.fn().mockResolvedValue({});
    usePurchaseOrdersMock.mockReturnValue({
      items: [{
        id: "order-confirmed",
        supplierId: "supplier-1",
        employeeId: null,
        createdByWebUser: null,
        status: "CONFIRMADA",
        subtotal: "100",
        taxAmount: "13",
        total: "113",
        createdAt: "2026-10-03T12:00:00.000Z",
        supplier: { id: "supplier-1", name: "Proveedor Uno" },
      }],
      total: 1,
      loading: false,
      isError: false,
      error: null,
      refresh: jest.fn(),
      createOrder: jest.fn(),
      confirmOrder: jest.fn(),
      receiveOrder,
      cancelOrder,
      submitting: false,
    });

    render(<OrdenesContent />);
    const row = within(screen.getByRole("table")).getByText("Proveedor Uno").closest("tr") as HTMLElement;
    await user.click(within(row).getByRole("button", { name: actionLabel }));
    expect(action === "receiveOrder" ? receiveOrder : cancelOrder).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(action === "receiveOrder" ? receiveOrder : cancelOrder).not.toHaveBeenCalled();

    await user.click(within(row).getByRole("button", { name: actionLabel }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: confirmLabel }));
    await waitFor(() => expect(action === "receiveOrder" ? receiveOrder : cancelOrder).toHaveBeenCalled());
  });
});
