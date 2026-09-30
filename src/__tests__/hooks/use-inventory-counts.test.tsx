import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { inventoryCountsApi } from "@/lib/api/inventory-counts";
import { useApplyInventoryCount } from "@/hooks/use-inventory-counts";

describe("hooks de conteos físicos", () => {
  it("invalida conteos, inventario, alertas y productos después de aplicar", async () => {
    jest.spyOn(inventoryCountsApi, "apply").mockResolvedValue({} as never);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useApplyInventoryCount(), { wrapper });
    await result.current.mutateAsync("count-1");
    await waitFor(() => expect(invalidate).toHaveBeenCalled());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["inventory-counts"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["inventory", "alerts"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["inventory", "valuation"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["products"] });
  });
});
