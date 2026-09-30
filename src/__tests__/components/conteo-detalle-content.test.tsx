import { render, screen } from "@testing-library/react";
import { useSession } from "@/contexts/session-context";
import {
  useApplyInventoryCount,
  useCancelInventoryCount,
  useCaptureInventoryCount,
  useInventoryCount,
  useInventoryCountLines,
} from "@/hooks/use-inventory-counts";
import ConteoDetalleContent from "@/app/(admin)/inventario/conteos/[id]/conteo-detalle-content";

jest.mock("@/contexts/session-context", () => ({ useSession: jest.fn() }));
jest.mock("@/hooks/use-inventory-counts", () => ({
  useApplyInventoryCount: jest.fn(),
  useCancelInventoryCount: jest.fn(),
  useCaptureInventoryCount: jest.fn(),
  useInventoryCount: jest.fn(),
  useInventoryCountLines: jest.fn(),
}));

const count = {
  id: "count-1",
  folio: 12,
  name: "Conteo prueba",
  status: "ABIERTO" as const,
  createdAt: "2026-09-29T10:00:00.000Z",
  updatedAt: "2026-09-29T10:00:00.000Z",
  summary: { totalLines: 1, countedLines: 0, pendingLines: 1, linesWithVariance: 0, surplusQty: "0", surplusValue: "0", shortageQty: "0", shortageValue: "0", netQty: "0", netValue: "0" },
};

const lines = { items: [{ id: "line-1", productId: "product-1", systemStockAtStart: "5", countedQuantity: null, systemStockAtCount: null, countedAt: null, varianceQuantity: null, varianceValue: null, product: { id: "product-1", code: "P-1", description: "Producto", unit: "unidad", decimals: 0, currentStock: "5", costPrice: "2", } }], total: 1, take: 50, skip: 0 };

function setMocks(role: "ADMIN" | "ACCOUNTANT") {
  (useSession as jest.Mock).mockReturnValue({ user: { id: "user-1", name: role, email: `${role}@test.local`, role }, isLoading: false });
  (useInventoryCount as jest.Mock).mockReturnValue({ data: count, isLoading: false, isError: false });
  (useInventoryCountLines as jest.Mock).mockReturnValue({ data: lines, isLoading: false, isError: false });
  (useApplyInventoryCount as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
  (useCancelInventoryCount as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
  (useCaptureInventoryCount as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
}

describe("detalle de conteo físico", () => {
  beforeEach(() => jest.clearAllMocks());

  it("ACCOUNTANT ve exportación pero no controles de escritura", () => {
    setMocks("ACCOUNTANT");
    render(<ConteoDetalleContent id="count-1" />);
    expect(screen.getByRole("button", { name: "Exportar Excel" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar capturas" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aplicar conteo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar conteo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("ADMIN ve inputs y acciones de escritura en un conteo abierto", () => {
    setMocks("ADMIN");
    render(<ConteoDetalleContent id="count-1" />);
    expect(screen.getByRole("spinbutton", { name: "Captura P-1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar capturas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aplicar conteo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar conteo" })).toBeInTheDocument();
  });
});
