/**
 * Pruebas para el token manager: expiración, persistencia y eventos.
 */

import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  isTokenExpired,
  getTokenExpiry,
} from "@/lib/token-manager";

describe("Token Manager", () => {
  let mockSessionStorage: Record<string, string>;
  let mockGetItem: jest.Mock;
  let mockSetItem: jest.Mock;
  let mockRemoveItem: jest.Mock;
  let mockDispatchEvent: jest.Mock;

  beforeEach(() => {
    mockSessionStorage = {};
    mockGetItem = jest.fn((key) => mockSessionStorage[key] ?? null);
    mockSetItem = jest.fn((key, value) => {
      mockSessionStorage[key] = value;
    });
    mockRemoveItem = jest.fn((key) => {
      delete mockSessionStorage[key];
    });
    mockDispatchEvent = jest.fn();
    
    global.sessionStorage = {
      getItem: mockGetItem,
      setItem: mockSetItem,
      removeItem: mockRemoveItem,
      clear: jest.fn(() => {
        mockSessionStorage = {};
      }),
      length: 0,
      key: jest.fn(),
    };

    global.window = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: mockDispatchEvent,
    } as unknown as Window & typeof globalThis;

    jest.clearAllMocks();
  });

  afterEach(() => {
    clearAccessToken();
  });

  describe("setAccessToken", () => {
    it("debe guardar el token y establecer expiración", () => {
      const token = "test-token-123";
      setAccessToken(token);

      expect(mockSetItem).toHaveBeenCalledWith(
        "ferreteria_access_token",
        token
      );
      expect(mockSetItem).toHaveBeenCalledWith(
        "ferreteria_token_expiry",
        expect.any(String)
      );
      expect(mockDispatchEvent).toHaveBeenCalled();
    });

    it("debe limpiar el token cuando se pasa null", () => {
      setAccessToken("test-token");
      mockRemoveItem.mockClear();
      setAccessToken(null);

      expect(mockRemoveItem).toHaveBeenCalledWith(
        "ferreteria_access_token"
      );
      expect(mockRemoveItem).toHaveBeenCalledWith(
        "ferreteria_token_expiry"
      );
    });
  });

  describe("getAccessToken", () => {
    it("debe retornar el token válido", () => {
      const token = "valid-token";
      const futureExpiry = Date.now() + 1000 * 60 * 60;
      
      mockSessionStorage["ferreteria_access_token"] = token;
      mockSessionStorage["ferreteria_token_expiry"] = futureExpiry.toString();

      const result = getAccessToken();
      expect(result).toBe(token);
      expect(mockGetItem).toHaveBeenCalled();
    });

    it("debe retornar null si el token expiró", () => {
      const token = "expired-token";
      const pastExpiry = Date.now() - 1000;
      
      mockSessionStorage["ferreteria_access_token"] = token;
      mockSessionStorage["ferreteria_token_expiry"] = pastExpiry.toString();

      const result = getAccessToken();
      expect(result).toBeNull();
      expect(mockDispatchEvent).toHaveBeenCalled();
    });

    it("debe retornar null si no hay token", () => {
      const result = getAccessToken();
      expect(result).toBeNull();
    });
  });

  describe("isTokenExpired", () => {
    it("debe retornar false para token válido", () => {
      const futureExpiry = Date.now() + 1000 * 60 * 60;
      mockSessionStorage["ferreteria_token_expiry"] = futureExpiry.toString();

      const result = isTokenExpired();
      expect(result).toBe(false);
    });

    it("debe retornar true para token expirado", () => {
      const pastExpiry = Date.now() - 1000;
      mockSessionStorage["ferreteria_token_expiry"] = pastExpiry.toString();

      const result = isTokenExpired();
      expect(result).toBe(true);
    });

    it("debe retornar true si no hay expiración", () => {
      const result = isTokenExpired();
      expect(result).toBe(true);
    });
  });

  describe("clearAccessToken", () => {
    it("debe limpiar token y expiración", () => {
      setAccessToken("test-token");
      mockRemoveItem.mockClear();
      clearAccessToken();

      expect(mockRemoveItem).toHaveBeenCalledWith(
        "ferreteria_access_token"
      );
      expect(mockRemoveItem).toHaveBeenCalledWith(
        "ferreteria_token_expiry"
      );
    });
  });

  describe("getTokenExpiry", () => {
    it("debe retornar la expiración del token", () => {
      const expiry = Date.now() + 1000 * 60 * 60;
      mockSessionStorage["ferreteria_token_expiry"] = expiry.toString();

      const result = getTokenExpiry();
      expect(result).toBe(expiry);
    });

    it("debe retornar null si no hay expiración", () => {
      const result = getTokenExpiry();
      expect(result).toBeNull();
    });
  });
});
