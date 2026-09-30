/** Pruebas del cliente HTTP admin, tienda, CSRF y expiración por 401. */

import { ApiError, api, apiRequest } from "@/lib/api";
import { clearCsrfToken, clearSessionState, getCsrfToken, setCsrfToken } from "@/lib/session-state";
import {
  clearShopSessionState,
  getShopCustomer,
  setShopCustomer,
  setShopCsrfToken,
} from "@/lib/shop-session-state";

global.fetch = jest.fn();

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

describe("cliente API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCsrfToken();
    clearSessionState();
    clearShopSessionState();
  });

  it("usa cookies include y no Authorization para admin", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response({ success: true, data: {} }));
    await api.get("/protected");
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/protected"), expect.objectContaining({
      credentials: "include",
      headers: expect.not.objectContaining({ Authorization: expect.anything() }),
    }));
  });

  it("usa credentials include en tienda y nunca envía Authorization", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response({ success: true, data: {} }));
    await apiRequest("/shop/auth/me", { auth: "shop", token: "shop-token" });
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ credentials: "include" }));
    expect((fetch as jest.Mock).mock.calls[0][1].headers.get("Authorization")).toBeNull();
  });

  it("pide CSRF de tienda para mutaciones y no usa el CSRF admin", async () => {
    setCsrfToken("admin-csrf");
    (fetch as jest.Mock)
      .mockResolvedValueOnce(response({ success: true, data: { csrfToken: "shop-csrf" } }))
      .mockResolvedValueOnce(response({ success: true, data: {} }));
    await apiRequest("/shop/cart", { method: "POST", auth: "shop", token: null });
    expect((fetch as jest.Mock).mock.calls[0][0]).toContain("/shop/auth/csrf");
    expect((fetch as jest.Mock).mock.calls[1][1].headers.get("X-CSRF-Token")).toBe("shop-csrf");
  });

  it("no pide CSRF para login y registro públicos de tienda", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response({ success: true, data: {} }));
    await apiRequest("/shop/auth/login", { method: "POST", auth: "shop", token: null });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((fetch as jest.Mock).mock.calls[0][1].credentials).toBe("include");
    expect((fetch as jest.Mock).mock.calls[0][1].headers.get("X-CSRF-Token")).toBeNull();
  });

  it("usa credentials omit en llamadas públicas", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response({ success: true, data: {} }));
    await apiRequest("/public/catalog/products", { auth: "none", token: null });
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ credentials: "omit" }));
  });

  it("añade CSRF a mutaciones admin, pero no a GET", async () => {
    setCsrfToken("csrf-1");
    (fetch as jest.Mock)
      .mockResolvedValueOnce(response({ success: true, data: {} }))
      .mockResolvedValueOnce(response({ success: true, data: {} }));
    await api.post("/things", { name: "x" });
    await api.get("/things");
    expect((fetch as jest.Mock).mock.calls[0][1].headers.get("X-CSRF-Token")).toBe("csrf-1");
    expect((fetch as jest.Mock).mock.calls[1][1].headers.get("X-CSRF-Token")).toBeNull();
  });

  it("deduplica la recuperación CSRF antes de mutaciones concurrentes", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(response({ success: true, data: { csrfToken: "csrf-2" } }))
      .mockResolvedValueOnce(response({ success: true, data: {} }))
      .mockResolvedValueOnce(response({ success: true, data: {} }));
    await Promise.all([api.post("/one", {}), api.post("/two", {})]);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect((fetch as jest.Mock).mock.calls[0][0]).toContain("/auth/csrf");
  });

  it("refresca CSRF y reintenta exactamente una vez", async () => {
    setCsrfToken("stale");
    (fetch as jest.Mock)
      .mockResolvedValueOnce(response({ success: false, error: "CSRF_INVALID" }, 403))
      .mockResolvedValueOnce(response({ success: true, data: { csrfToken: "fresh" } }))
      .mockResolvedValueOnce(response({ success: true, data: { ok: true } }));
    await expect(api.post("/things", {})).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect((fetch as jest.Mock).mock.calls[2][1].headers.get("X-CSRF-Token")).toBe("fresh");
  });

  it("no reintenta más de una vez si CSRF vuelve a fallar", async () => {
    setCsrfToken("stale");
    (fetch as jest.Mock)
      .mockResolvedValueOnce(response({ success: false, error: "CSRF_INVALID" }, 403))
      .mockResolvedValueOnce(response({ success: true, data: { csrfToken: "fresh" } }))
      .mockResolvedValueOnce(response({ success: false, error: "CSRF_INVALID" }, 403));
    await expect(api.post("/things", {})).rejects.toMatchObject({ status: 403 });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("limpia sesión y emite unauthorized ante 401 admin", async () => {
    const listener = jest.fn();
    window.addEventListener("unauthorized", listener);
    (fetch as jest.Mock).mockResolvedValueOnce(response({ error: "UNAUTHORIZED" }, 401));
    await expect(api.get("/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener("unauthorized", listener);
  });

  it("emite unauthorized si /auth/csrf responde 401 tras recargar", async () => {
    const listener = jest.fn();
    window.addEventListener("unauthorized", listener);
    (fetch as jest.Mock).mockResolvedValueOnce(response({ success: false, error: "UNAUTHORIZED" }, 401));
    await expect(api.post("/things", {})).rejects.toMatchObject({ status: 401 });
    expect((fetch as jest.Mock).mock.calls[0][0]).toContain("/auth/csrf");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener("unauthorized", listener);
  });

  it("refresca CSRF de tienda y reintenta exactamente una vez", async () => {
    setShopCsrfToken("stale-shop");
    (fetch as jest.Mock)
      .mockResolvedValueOnce(response({ success: false, error: "CSRF_INVALID" }, 403))
      .mockResolvedValueOnce(response({ success: true, data: { csrfToken: "fresh-shop" } }))
      .mockResolvedValueOnce(response({ success: true, data: { ok: true } }));
    await expect(apiRequest("/shop/cart", { method: "POST", auth: "shop", token: null }))
      .resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect((fetch as jest.Mock).mock.calls[2][1].headers.get("X-CSRF-Token")).toBe("fresh-shop");
  });

  it("no emite unauthorized ante 401 de tienda", async () => {
    setCsrfToken("admin-csrf");
    setShopCustomer({ id: "shop-1", email: "shop@example.com", fullName: "Cliente" });
    setShopCsrfToken("shop-csrf");
    const listener = jest.fn();
    window.addEventListener("unauthorized", listener);
    (fetch as jest.Mock).mockResolvedValueOnce(response({ error: "UNAUTHORIZED" }, 401));
    await expect(apiRequest("/shop/auth/me", { auth: "shop", token: "shop" })).rejects.toBeInstanceOf(ApiError);
    expect(listener).not.toHaveBeenCalled();
    expect(getShopCustomer()).toBeNull();
    expect(getCsrfToken()).toBe("admin-csrf");
    window.removeEventListener("unauthorized", listener);
  });

  it("trata 401 de /shop/auth/csrf como sesión de tienda vencida", async () => {
    setShopCustomer({ id: "shop-1", email: "shop@example.com", fullName: "Cliente" });
    const listener = jest.fn();
    window.addEventListener("shop-session-changed", listener);
    (fetch as jest.Mock).mockResolvedValueOnce(response({ error: "UNAUTHORIZED" }, 401));
    await expect(apiRequest("/shop/cart", { method: "POST", auth: "shop", token: null }))
      .rejects.toMatchObject({ status: 401 });
    expect(getShopCustomer()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener("shop-session-changed", listener);
  });
});
