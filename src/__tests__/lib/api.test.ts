/**
 * Pruebas para el cliente API: manejo de errores, autenticación y respuestas.
 */

import { ApiError, api } from "@/lib/api";

global.fetch = jest.fn();

describe("API Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
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
      const mockSessionStorage: Record<string, string> = {
        ferreteria_access_token: mockToken,
        ferreteria_token_expiry: (Date.now() + 1000 * 60 * 60).toString(),
      };
      
      const mockGetItem = jest.fn((key) => mockSessionStorage[key] ?? null);
      
      global.sessionStorage = {
        getItem: mockGetItem,
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn(),
      };

      global.window = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      } as unknown as Window & typeof globalThis;

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
  });
});
