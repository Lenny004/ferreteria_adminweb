import { apiRequest } from "@/lib/api";
import { shopOrdersApi } from "@/lib/api/shop-orders";

jest.mock("@/lib/api", () => ({ apiRequest: jest.fn() }));

describe("cliente de pedidos de tienda", () => {
  it("envía la referencia de transferencia al endpoint de tienda", async () => {
    (apiRequest as jest.Mock).mockResolvedValue({});

    await shopOrdersApi.submitTransferReference("order-1", {
      reference: "TRF-123",
      notes: "Transferencia realizada hoy",
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/shop/orders/order-1/transfer-reference",
      expect.objectContaining({
        method: "POST",
        token: null,
        auth: "shop",
        body: JSON.stringify({ reference: "TRF-123", notes: "Transferencia realizada hoy" }),
      }),
    );
  });
});

