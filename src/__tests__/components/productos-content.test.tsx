import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "@/contexts/session-context";
import {
  useCreateProduct,
  useProductCatalog,
  useProductFormOptions,
  useUpdateProduct,
} from "@/hooks/use-products";
import ProductosContent from "@/app/(admin)/inventario/productos/productos-content";

jest.mock("@/contexts/session-context", () => ({ useSession: jest.fn() }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/hooks/use-products", () => ({
  PRODUCTS_PAGE_SIZE: 20,
  useCreateProduct: jest.fn(),
  useProductCatalog: jest.fn(),
  useProductFormOptions: jest.fn(),
  useUpdateProduct: jest.fn(),
}));

const product = {
  id: "product-1",
  code: "HER-1",
  description: "Martillo",
  salePrice: "9.50",
  costPrice: "4.0000",
  currentStock: "1",
  minStock: "2",
  isActive: true,
  familyId: "family-1",
  subfamilyId: null,
  measurementTypeId: "unit-1",
  family: { id: "family-1", code: "HER", name: "Herramientas" },
  measurementType: { id: "unit-1", code: "UND", name: "Unidad" },
};

function setMocks(role: "ADMIN" | "ACCOUNTANT" | "OWNER") {
  (useSession as jest.Mock).mockReturnValue({ user: { id: "u-1", name: role, email: "u@test.local", role }, isLoading: false });
  (useProductCatalog as jest.Mock).mockReturnValue({ data: { items: [product], total: 1 }, isLoading: false, isError: false });
  (useProductFormOptions as jest.Mock).mockReturnValue({
    data: {
      families: [
        { id: "family-1", code: "HER", name: "Herramientas", subfamilies: [{ id: "sub-1", code: "MAN", name: "Manuales" }] },
      ],
      measurementTypes: [{ id: "unit-1", code: "UND", name: "Unidad", unitLabel: "und", decimals: 0 }],
    },
    isError: false,
  });
  const create = jest.fn().mockResolvedValue({ id: "product-2" });
  const update = jest.fn().mockResolvedValue({ id: "product-1" });
  (useCreateProduct as jest.Mock).mockReturnValue({ mutateAsync: create, isPending: false });
  (useUpdateProduct as jest.Mock).mockReturnValue({ mutateAsync: update, isPending: false });
  return { create, update };
}

describe("catálogo de productos", () => {
  beforeEach(() => jest.clearAllMocks());

  it("el contador consulta y abre el kardex, pero no ve acciones de escritura", () => {
    setMocks("ACCOUNTANT");
    render(<ProductosContent />);
    expect(screen.getByRole("link", { name: "Kardex" })).toHaveAttribute("href", "/inventario/productos/product-1/kardex");
    expect(screen.queryByRole("button", { name: "Nuevo producto" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
  });

  it("marca el stock en o por debajo del mínimo", () => {
    setMocks("ADMIN");
    render(<ProductosContent />);
    const row = screen.getByText("HER-1").closest("tr") as HTMLElement;
    expect(within(row).getByText(/Mín\./)).toBeInTheDocument();
  });

  it("ADMIN crea un producto sin enviar stock inicial", async () => {
    const user = userEvent.setup();
    const { create } = setMocks("ADMIN");
    render(<ProductosContent />);

    await user.click(screen.getByRole("button", { name: "Nuevo producto" }));
    const dialog = within(await screen.findByRole("dialog"));
    await user.type(dialog.getByLabelText(/^Código \*?$/), "HER-2");
    await user.type(dialog.getByLabelText(/^Descripción/), "Alicate");
    await user.selectOptions(dialog.getByLabelText(/^Familia/), "family-1");
    await user.selectOptions(dialog.getByLabelText(/^Subfamilia/), "sub-1");
    await user.selectOptions(dialog.getByLabelText(/^Unidad de medida/), "unit-1");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    const payload = create.mock.calls[0][0];
    expect(payload).toMatchObject({ code: "HER-2", description: "Alicate", familyId: "family-1", subfamilyId: "sub-1", measurementTypeId: "unit-1" });
    expect(payload).not.toHaveProperty("currentStock");
  });

  it("muestra errores por campo y no llama a la API si faltan datos", async () => {
    const user = userEvent.setup();
    const { create } = setMocks("OWNER");
    render(<ProductosContent />);

    await user.click(screen.getByRole("button", { name: "Nuevo producto" }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Ingresa el código del producto.")).toBeInTheDocument();
    expect(screen.getByText("Selecciona una familia.")).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it("pide confirmación antes de desactivar un producto", async () => {
    const user = userEvent.setup();
    const { update } = setMocks("ADMIN");
    render(<ProductosContent />);

    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.click(screen.getByLabelText("Activo"));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(update).not.toHaveBeenCalled();
    await user.click(await screen.findByRole("button", { name: "Desactivar" }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ id: "product-1", data: expect.objectContaining({ isActive: false }) }),
    );
  });
});
