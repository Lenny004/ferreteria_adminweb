import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LibrosIvaContent from "@/app/(admin)/fiscal/libros-iva/libros-iva-content";
import { useDteList, useIvaPeriod } from "@/hooks/use-fiscal";

jest.mock("@/hooks/use-fiscal", () => ({ useDteList: jest.fn(), useIvaPeriod: jest.fn() }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const ivaPeriodMock = useIvaPeriod as jest.Mock;
const dteListMock = useDteList as jest.Mock;

describe("confirmación de cierre de libros IVA", () => {
  it("no cierra el libro antes de confirmar y cancelar no llama a la API", async () => {
    const user = userEvent.setup();
    const close = jest.fn().mockResolvedValue({});
    ivaPeriodMock.mockReturnValue({
      data: { previews: [{ reportType: "VENTAS_CF", live: { lineCount: 1, totalGravada: "100", totalIva: "13" }, saved: { id: "iva-1", status: "BORRADOR" }, balanced: true }] },
      loading: false, isError: false, error: null, refetch: jest.fn(), generate: jest.fn(), close, submitting: false,
    });
    dteListMock.mockReturnValue({ data: { items: [], total: 0 }, isLoading: false, isError: false, error: null, refetch: jest.fn() });

    render(<LibrosIvaContent />);
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(close).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(close).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cerrar libro" }));
    await waitFor(() => expect(close).toHaveBeenCalledWith("iva-1"));
  });
});
