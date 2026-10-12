import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  useCreateMovement,
  useInventoryMovements,
  useInventoryValuation,
  useProductsForInventory,
  useResolveAlert,
  useStockAlerts,
} from "@/hooks/use-inventory";
import InventarioContent from "@/app/(admin)/inventario/inventario-content";

jest.mock("@/hooks/use-inventory", () => ({
  useCreateMovement: jest.fn(),
  useInventoryMovements: jest.fn(),
  useInventoryValuation: jest.fn(),
  useProductsForInventory: jest.fn(),
  useResolveAlert: jest.fn(),
  useStockAlerts: jest.fn(),
}));

const movements = [
  {
    id: "movement-sale",
    productId: "product-1",
    movementType: "SALIDA_VENTA",
    quantity: "5",
    direction: "SALIDA" as const,
    unitCost: "2",
    totalCost: "10",
    stockBefore: "10",
    stockAfter: "5",
    createdAt: "2026-09-29T10:00:00.000Z",
    product: {
      id: "product-1",
      code: "P-1",
      description: "Producto 1",
      currentStock: "5",
      minStock: "1",
    },
  },
  {
    id: "movement-return",
    productId: "product-2",
    movementType: "ENTRADA_DEVOLUCION",
    quantity: "2",
    direction: "ENTRADA" as const,
    unitCost: "3",
    totalCost: "6",
    stockBefore: "4",
    stockAfter: "6",
    createdAt: "2026-09-29T11:00:00.000Z",
    product: {
      id: "product-2",
      code: "P-2",
      description: "Producto 2",
      currentStock: "6",
      minStock: "1",
    },
  },
];

function configureMocks() {
  (useInventoryMovements as jest.Mock).mockReturnValue({
    data: { items: movements, total: movements.length },
    isLoading: false,
  });
  (useProductsForInventory as jest.Mock).mockReturnValue({ data: { items: [] } });
  (useStockAlerts as jest.Mock).mockReturnValue({
    data: { items: [], total: 0 },
    isLoading: false,
  });
  (useInventoryValuation as jest.Mock).mockReturnValue({
    data: { items: [], totalInventoryValue: "0" },
    isLoading: false,
  });
  (useCreateMovement as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
  (useResolveAlert as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
}

describe("tabla de movimientos de inventario", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureMocks();
  });

  it("muestra etiquetas, signos, clases y atributos de dirección", () => {
    render(<InventarioContent />);

    const [saleRow, returnRow] = screen.getAllByTestId("movement-qty").map((cell) => cell.closest("tr") as HTMLElement);
    expect(within(saleRow).getByText("Venta", { exact: true })).toBeInTheDocument();
    expect(within(returnRow).getByText("Devolución de venta", { exact: true })).toBeInTheDocument();

    const quantities = screen.getAllByTestId("movement-qty");
    expect(quantities[0]).toHaveTextContent("-5");
    expect(quantities[0]).toHaveClass("text-danger");
    expect(quantities[0]).toHaveAttribute("data-direction", "SALIDA");
    expect(quantities[0]).toHaveAttribute("aria-label", "Salida de 5");
    expect(quantities[1]).toHaveTextContent("+2");
    expect(quantities[1]).toHaveClass("text-success");
    expect(quantities[1]).toHaveAttribute("data-direction", "ENTRADA");
    expect(quantities[1]).toHaveAttribute("title", "Entrada de 2");
  });

  it("ofrece solo los cinco tipos reales y filtra SALIDA_VENTA", async () => {
    const user = userEvent.setup();
    render(<InventarioContent />);

    const filter = screen.getByRole("combobox", { name: "Tipo de movimiento" });
    const options = within(filter).getAllByRole("option");

    expect(options.map((option) => option.textContent)).toEqual([
      "Todos",
      "Entrada por compra",
      "Devolución de venta",
      "Ajuste de entrada",
      "Venta",
      "Ajuste de salida",
    ]);
    expect(options.map((option) => option.getAttribute("value"))).not.toEqual(
      expect.arrayContaining(["VENTA", "DEVOLUCION_VENTA"]),
    );

    await user.selectOptions(filter, "SALIDA_VENTA");
    expect(useInventoryMovements).toHaveBeenLastCalledWith({
      productId: undefined,
      movementType: "SALIDA_VENTA",
    });
  });

  it("usa las etiquetas nuevas en el formulario de movimientos admin", () => {
    render(<InventarioContent />);

    const typeSelect = screen.getByDisplayValue("Entrada por compra");
    const options = within(typeSelect).getAllByRole("option");

    expect(options.map((option) => option.textContent)).toEqual([
      "Entrada por compra",
      "Ajuste de entrada",
      "Ajuste de salida",
    ]);
    expect(options.map((option) => option.getAttribute("value"))).toEqual([
      "ENTRADA_COMPRA",
      "AJUSTE_ENTRADA",
      "AJUSTE_SALIDA",
    ]);
    expect(screen.getByText(/Tipos admin: Entrada por compra, Ajuste de entrada, Ajuste de salida\./)).toBeInTheDocument();
  });

  it("no registra un movimiento manual hasta confirmar y cancelar no llama a la API", async () => {
    const user = userEvent.setup();
    const createMovement = jest.fn().mockResolvedValue({});
    const product = {
      id: "product-1",
      code: "P-1",
      description: "Producto 1",
      currentStock: "5",
      minStock: "1",
      costPrice: "2",
    };
    (useProductsForInventory as jest.Mock).mockReturnValue({ data: { items: [product] } });
    (useCreateMovement as jest.Mock).mockReturnValue({ mutateAsync: createMovement, isPending: false });

    render(<InventarioContent />);
    await user.selectOptions(screen.getByLabelText("Producto"), "product-1");
    await user.click(screen.getByRole("button", { name: "Registrar" }));

    expect(createMovement).not.toHaveBeenCalled();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("Producto 1");
    expect(dialog).toHaveTextContent("Entrada por compra");
    expect(dialog).toHaveTextContent("afectará el stock");

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(createMovement).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Registrar" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Registrar movimiento" }));
    await waitFor(() => expect(createMovement).toHaveBeenCalledWith(expect.objectContaining({
      productId: "product-1",
      movementType: "ENTRADA_COMPRA",
      quantity: 1,
    })));
  });
});
