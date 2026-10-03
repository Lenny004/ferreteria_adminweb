import { api } from "@/lib/api";
import { purchaseOrdersApi, type CreatePurchaseOrderInput } from "@/lib/api/purchase-orders";

describe("cliente API de órdenes de compra", () => {
  afterEach(() => jest.restoreAllMocks());

  it("crea órdenes sin enviar employeeId", async () => {
    const post = jest.spyOn(api, "post").mockResolvedValue({} as never);
    const input: CreatePurchaseOrderInput = {
      supplierId: "supplier-1",
      lines: [],
    };

    await purchaseOrdersApi.create(input);

    expect(post).toHaveBeenCalledWith("/purchase-orders", input);
    expect(input).not.toHaveProperty("employeeId");
  });
});
