import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LibrosIvaContent from "@/app/(admin)/fiscal/libros-iva/libros-iva-content";
import LibroIvaMensualContent from "@/app/(admin)/fiscal/libros-iva/[year]/[month]/libro-iva-mensual-content";
import { useDteList, useIvaPeriod, useIvaReport } from "@/hooks/use-fiscal";
import { useParams } from "next/navigation";

jest.mock("@/hooks/use-fiscal", () => ({ useDteList: jest.fn(), useIvaPeriod: jest.fn(), useIvaReport: jest.fn() }));
jest.mock("next/navigation", () => ({ useParams: jest.fn() }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const ivaPeriodMock = useIvaPeriod as jest.Mock;
const dteListMock = useDteList as jest.Mock;
const ivaReportMock = useIvaReport as jest.Mock;
const paramsMock = useParams as jest.Mock;

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

describe("generación de libros IVA mensuales", () => {
  function configureMonthlyPeriod(saved: { id: string; status: "BORRADOR" | "CERRADO" } | null) {
    const generate = jest.fn().mockResolvedValue({});
    paramsMock.mockReturnValue({ year: "2026", month: "9" });
    ivaPeriodMock.mockReturnValue({
      data: {
        previews: [{
          reportType: "VENTAS_CF",
          live: { lineCount: 1, totalGravada: 100, totalIva: 13 },
          saved,
          balanced: true,
        }],
      },
      loading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      generate,
      close: jest.fn(),
      submitting: false,
    });
    ivaReportMock.mockReturnValue({ data: null, isLoading: false, isError: false, error: null, refetch: jest.fn() });
    return generate;
  }

  it("espera confirmación antes de reemplazar un borrador del período", async () => {
    const user = userEvent.setup();
    const generate = configureMonthlyPeriod({ id: "iva-1", status: "BORRADOR" });
    render(<LibroIvaMensualContent />);

    await user.click(screen.getByRole("button", { name: "Generar" }));
    expect(generate).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toHaveTextContent("09/2026");
    expect(screen.getByRole("alertdialog")).toHaveTextContent("El borrador actual de ese período se reemplazará");

    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Reemplazar borrador" }));
    await waitFor(() => expect(generate).toHaveBeenCalledWith("VENTAS_CF"));
  });

  it("genera directamente cuando el período no tiene borrador", async () => {
    const user = userEvent.setup();
    const generate = configureMonthlyPeriod(null);
    render(<LibroIvaMensualContent />);

    await user.click(screen.getByRole("button", { name: "Generar" }));

    await waitFor(() => expect(generate).toHaveBeenCalledWith("VENTAS_CF"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
