import { render, screen } from "@testing-library/react";
import { useProductKardex } from "@/hooks/use-products";
import KardexContent from "@/app/(admin)/inventario/productos/[id]/kardex/kardex-content";

jest.mock("@/hooks/use-products", () => ({
  KARDEX_PAGE_SIZE: 50,
  useProductKardex: jest.fn(),
}));

const kardex = {
  product: {
    id: "product-1",
    code: "HER-1",
    description: "Martillo",
    currentStock: "8",
    minStock: "2",
    costPrice: "4",
    salePrice: "9.5",
    inventoryValue: "32.00",
  },
  items: [
    {
      id: "m-2",
      productId: "product-1",
      movementType: "AJUSTE_SALIDA",
      quantity: "2",
      direction: "SALIDA" as const,
      unitCost: "4",
      totalCost: "8",
      stockBefore: "10",
      stockAfter: "8",
      valuedBalance: "32.00",
      reason: "Merma",
      createdAt: "2026-10-02T10:00:00.000Z",
    },
    {
      id: "m-1",
      productId: "product-1",
      movementType: "ENTRADA_COMPRA",
      quantity: "10",
      direction: "ENTRADA" as const,
      unitCost: "4",
      totalCost: "40",
      stockBefore: "0",
      stockAfter: "10",
      valuedBalance: "40.00",
      reason: null,
      createdAt: "2026-10-01T10:00:00.000Z",
    },
  ],
  total: 2,
  take: 50,
  skip: 0,
};

describe("kardex de producto", () => {
  beforeEach(() => jest.clearAllMocks());

  it("muestra resumen y movimientos con signo y saldo valorado", () => {
    (useProductKardex as jest.Mock).mockReturnValue({ data: kardex, isLoading: false, isError: false });
    render(<KardexContent productId="product-1" />);

    expect(screen.getByRole("heading", { name: "Kardex · HER-1" })).toBeInTheDocument();
    expect(screen.getByText("Movimientos (2)")).toBeInTheDocument();
    const quantities = screen.getAllByTestId("kardex-qty").map((cell) => cell.textContent);
    expect(quantities[0]).toMatch(/^-2/);
    expect(quantities[1]).toMatch(/^\+10/);
    expect(screen.getByText("Merma")).toBeInTheDocument();
    expect(useProductKardex).toHaveBeenCalledWith("product-1", 0);
  });

  it("informa cuando el producto no tiene movimientos", () => {
    (useProductKardex as jest.Mock).mockReturnValue({
      data: { ...kardex, items: [], total: 0 },
      isLoading: false,
      isError: false,
    });
    render(<KardexContent productId="product-1" />);
    expect(screen.getByText("Sin movimientos")).toBeInTheDocument();
  });
});
