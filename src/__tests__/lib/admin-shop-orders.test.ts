import { api } from "@/lib/api";
import { adminShopOrdersApi } from "@/lib/api/admin-shop-orders";

describe("cliente API administrativo de pedidos de tienda", () => {
  afterEach(() => jest.restoreAllMocks());

  it("construye la ruta y los filtros del listado", async () => {
    const get = jest.spyOn(api, "get").mockResolvedValue({} as never);

    await adminShopOrdersApi.list({
      status: "PENDIENTE",
      paymentStatus: "EN_VERIFICACION",
      q: "Ana Pérez",
      take: 20,
      skip: 40,
    });

    expect(get).toHaveBeenCalledWith(
      "/shop-orders?status=PENDIENTE&paymentStatus=EN_VERIFICACION&q=Ana+P%C3%A9rez&take=20&skip=40",
    );
  });

  it("usa GET, PATCH y POST en las rutas administrativas del contrato", async () => {
    const get = jest.spyOn(api, "get").mockResolvedValue({} as never);
    const patch = jest.spyOn(api, "patch").mockResolvedValue({} as never);
    const post = jest.spyOn(api, "post").mockResolvedValue({} as never);

    await adminShopOrdersApi.getById("order-1");
    await adminShopOrdersApi.update("order-1", { status: "CANCELADA" });
    await adminShopOrdersApi.confirmPayment("order-1", {
      providerRef: "TRX-1",
      notes: "Revisado",
      expectedCustomerReference: "CLIENTE-1",
      expectedCustomerReferenceAt: "2026-10-03T11:30:00.000Z",
    });

    expect(get).toHaveBeenCalledWith("/shop-orders/order-1");
    expect(patch).toHaveBeenCalledWith("/shop-orders/order-1", { status: "CANCELADA" });
    expect(post).toHaveBeenCalledWith("/shop/orders/order-1/pay", {
      providerRef: "TRX-1",
      notes: "Revisado",
      expectedCustomerReference: "CLIENTE-1",
      expectedCustomerReferenceAt: "2026-10-03T11:30:00.000Z",
    });
  });
});
