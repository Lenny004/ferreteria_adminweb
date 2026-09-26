/**
 * Pruebas para el cliente API: manejo de errores, autenticación y respuestas.
 */

import { ApiError, api, apiRequest } from "@/lib/api";
import { clearAccessToken, setAccessToken } from "@/lib/token-manager";

global.fetch = jest.fn();

describe("API Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    clearAccessToken();
    sessionStorage.clear();
  });

  describe("ApiError", () => {
    it("debe crear un error con mensaje y código de estado", () => {
      const error = new ApiError("Test error", 400, "TEST_ERROR");
      expect(error.message).toBe("Test error");
      expect(error.status).toBe(400);
      expect(error.code).toBe("TEST_ERROR");
      expect(error.name).toBe("ApiError");
    });
  });

  describe("api.get", () => {
    it("debe hacer una petición GET exitosa", async () => {
      const mockData = { id: "1", name: "Test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: mockData }),
      });

      const result = await api.get("/test");
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("debe lanzar ApiError en caso de error HTTP", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ 
          success: false, 
          message: "No encontrado" 
        }),
      });

      await expect(api.get("/test")).rejects.toThrow(ApiError);
    });
  });

  describe("api.post", () => {
    it("debe hacer una petición POST con body", async () => {
      const mockPayload = { username: "test", password: "pass" };
      const mockResponse = { token: "abc123" };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: mockResponse }),
      });

      const result = await api.post("/auth/login", mockPayload);
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/login"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(mockPayload),
        })
      );
    });
  });

  describe("Autenticación", () => {
    it("debe incluir el token Bearer en las peticiones", async () => {
      const mockToken = "test-token-123";
      setAccessToken(mockToken);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: {} }),
      });

      await api.get("/protected");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it("no limpia la sesión por un 401 del login", async () => {
      setAccessToken("existing-admin-token");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: "Credenciales inválidas" }),
      });
      await expect(api.post("/auth/login", { login: "x", password: "y" })).rejects.toThrow(ApiError);
      expect(sessionStorage.getItem("ferreteria_access_token")).toBe("existing-admin-token");
    });

    it("no toca el token admin por un 401 de la tienda", async () => {
      setAccessToken("existing-admin-token");
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: "Sesión shop vencida" }),
      });
      await expect(apiRequest("/shop/auth/me", { token: "shop-token", auth: "shop" })).rejects.toThrow(ApiError);
      expect(sessionStorage.getItem("ferreteria_access_token")).toBe("existing-admin-token");
    });

    it("limpia y emite unauthorized por un 401 admin autenticado", async () => {
      setAccessToken("existing-admin-token");
      const unauthorizedSpy = jest.fn();
      window.addEventListener("unauthorized", unauthorizedSpy);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: "No autorizado" }),
      });
      await expect(api.get("/auth/me")).rejects.toThrow(ApiError);
      expect(sessionStorage.getItem("ferreteria_access_token")).toBeNull();
      expect(unauthorizedSpy).toHaveBeenCalledTimes(1);
      window.removeEventListener("unauthorized", unauthorizedSpy);
    });
  });
});
