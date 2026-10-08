import { render, screen, within } from "@testing-library/react";
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
});
