/** Pruebas del cierre de sesión de tienda y su limpieza local. */

import { shopAuthApi } from "@/lib/api/shop-auth";
import {
  clearShopSessionState,
  getShopCustomer,
  getShopCsrfToken,
  setShopCustomer,
  setShopCsrfToken,
} from "@/lib/shop-session-state";

global.fetch = jest.fn();

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

describe("shopAuthApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearShopSessionState();
  });

  it("llama al logout de tienda y limpia el estado aunque falle la red", async () => {
    setShopCustomer({ id: "shop-1", email: "shop@example.com", fullName: "Cliente" });
    setShopCsrfToken("shop-csrf");
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("sin red"));

    await shopAuthApi.logout();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/shop/auth/logout"),
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    expect(getShopCustomer()).toBeNull();
    expect(getShopCsrfToken()).toBeNull();
  });

  it("hace logout sin CSRF cuando la sesión ya venció", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(response({ error: "UNAUTHORIZED" }, 401))
      .mockResolvedValueOnce(response({ success: true, data: { loggedOut: true } }));

    await shopAuthApi.logout();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect((fetch as jest.Mock).mock.calls[0][0]).toContain("/shop/auth/csrf");
    expect((fetch as jest.Mock).mock.calls[1][0]).toContain("/shop/auth/logout");
    expect((fetch as jest.Mock).mock.calls[1][1].headers.get("X-CSRF-Token")).toBeNull();
  });
});
