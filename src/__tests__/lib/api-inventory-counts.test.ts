import { api } from "@/lib/api";
import { inventoryCountsApi } from "@/lib/api/inventory-counts";

describe("cliente API de conteos físicos", () => {
  afterEach(() => jest.restoreAllMocks());

  it("construye URLs y query string para listado y líneas", async () => {
    const get = jest.spyOn(api, "get").mockResolvedValue({} as never);
    await inventoryCountsApi.list({ status: "ABIERTO", take: 20, skip: 40 });
    await inventoryCountsApi.lines("count-1", { q: "tuerca 1", filter: "variance", take: 50, skip: 0 });
    expect(get).toHaveBeenNthCalledWith(1, "/inventory/counts?status=ABIERTO&take=20&skip=40");
    expect(get).toHaveBeenNthCalledWith(2, "/inventory/counts/count-1/lines?q=tuerca+1&filter=variance&take=50&skip=0");
  });

  it("usa los métodos y cuerpos definidos por el contrato", async () => {
    const post = jest.spyOn(api, "post").mockResolvedValue({} as never);
    const patch = jest.spyOn(api, "patch").mockResolvedValue({} as never);
    await inventoryCountsApi.create({ name: "Conteo", familyId: "family-1", notes: null });
    await inventoryCountsApi.capture("count-1", [{ productId: "product-1", countedQuantity: 2 }]);
    await inventoryCountsApi.apply("count-1");
    await inventoryCountsApi.cancel("count-1", "Ajuste de agenda");
    expect(post).toHaveBeenNthCalledWith(1, "/inventory/counts", { name: "Conteo", familyId: "family-1", notes: null });
    expect(patch).toHaveBeenCalledWith("/inventory/counts/count-1/lines", { items: [{ productId: "product-1", countedQuantity: 2 }] });
    expect(post).toHaveBeenNthCalledWith(2, "/inventory/counts/count-1/apply", { confirm: true });
    expect(post).toHaveBeenNthCalledWith(3, "/inventory/counts/count-1/cancel", { reason: "Ajuste de agenda" });
  });
});
