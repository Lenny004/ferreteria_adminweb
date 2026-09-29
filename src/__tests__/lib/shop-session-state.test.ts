/** Pruebas del estado efímero y aislado de la sesión de tienda. */

import {
  clearShopSessionState,
  ensureShopCsrfToken,
  getShopCsrfToken,
  migrateLegacyShopStorage,
  setShopCsrfToken,
} from "@/lib/shop-session-state";

describe("shop-session-state", () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearShopSessionState();
  });

  it("borra solo el token Bearer legado de tienda", () => {
    sessionStorage.setItem("ferreteria_shop_token", "legacy-shop");
    sessionStorage.setItem("otra-clave", "conservar");
    migrateLegacyShopStorage();
    expect(sessionStorage.getItem("ferreteria_shop_token")).toBeNull();
    expect(sessionStorage.getItem("otra-clave")).toBe("conservar");
  });

  it("conserva CSRF de tienda únicamente en memoria", () => {
    setShopCsrfToken("shop-csrf");
    expect(getShopCsrfToken()).toBe("shop-csrf");
    expect(sessionStorage.getItem("ferreteria_shop_csrf")).toBeNull();
  });

  it("deduplica la recuperación de CSRF de tienda", async () => {
    let calls = 0;
    const request = async () => {
      calls += 1;
      await Promise.resolve();
      return "shop-csrf-dedup";
    };
    await Promise.all([ensureShopCsrfToken(request), ensureShopCsrfToken(request)]);
    expect(calls).toBe(1);
    expect(getShopCsrfToken()).toBe("shop-csrf-dedup");
  });
});
