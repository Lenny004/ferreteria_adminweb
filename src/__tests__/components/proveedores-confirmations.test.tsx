import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProveedoresContent from "@/app/(admin)/compras/proveedores/proveedores-content";
import { useSuppliers } from "@/hooks/use-suppliers";

jest.mock("@/hooks/use-suppliers", () => ({ useSuppliers: jest.fn() }));

const suppliersMock = useSuppliers as jest.Mock;

describe("confirmaciones de proveedores", () => {
  it("no desactiva antes de confirmar y cancelar no llama a la API", async () => {
    const user = userEvent.setup();
    const updateSupplier = jest.fn().mockResolvedValue({});
    suppliersMock.mockReturnValue({
      items: [{ id: "supplier-1", name: "Ferremax", isActive: true, country: "SV", creditDays: 0 }],
      total: 1,
      pageSize: 20,
      loading: false,
      isError: false,
      error: null,
      refresh: jest.fn(),
      createSupplier: jest.fn(),
      updateSupplier,
      submitting: false,
    });

    render(<ProveedoresContent />);
    await user.click(screen.getByRole("button", { name: "Desactivar" }));
    expect(updateSupplier).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(updateSupplier).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Desactivar" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Desactivar" }));
    await waitFor(() => expect(updateSupplier).toHaveBeenCalledWith({ id: "supplier-1", data: { isActive: false } }));
  });

  it("al desmarcar Activo en edición espera la confirmación antes de guardar", async () => {
    const user = userEvent.setup();
    const updateSupplier = jest.fn().mockResolvedValue({});
    suppliersMock.mockReturnValue({
      items: [{ id: "supplier-1", name: "Ferremax", isActive: true, country: "SV", creditDays: 0 }],
      total: 1, pageSize: 20, loading: false, isError: false, error: null,
      refresh: jest.fn(), createSupplier: jest.fn(), updateSupplier, submitting: false,
    });

    render(<ProveedoresContent />);
    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("checkbox", { name: "Activo" }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(updateSupplier).not.toHaveBeenCalled();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("¿Desactivar al proveedor Ferremax?");
    await user.click(within(dialog).getByRole("button", { name: "Desactivar" }));

    await waitFor(() => expect(updateSupplier).toHaveBeenCalledWith({
      id: "supplier-1",
      data: expect.objectContaining({ isActive: false }),
    }));
  });
});
