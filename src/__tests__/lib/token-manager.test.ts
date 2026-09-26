/** Pruebas del token manager: persistencia, expiración y efectos explícitos. */

import {
  clearAccessToken,
  expireIfNeeded,
  getAccessToken,
  getTokenExpiry,
  isTokenExpired,
  setAccessToken,
} from "@/lib/token-manager";

describe("Token Manager", () => {
  let dispatchSpy: jest.SpyInstance;

  beforeEach(() => {
    clearAccessToken();
    sessionStorage.clear();
    dispatchSpy = jest.spyOn(window, "dispatchEvent");
    dispatchSpy.mockClear();
  });

  afterEach(() => {
    dispatchSpy.mockRestore();
  });

  it("guarda el token y establece una expiración", () => {
    setAccessToken("test-token-123");
    expect(sessionStorage.getItem("ferreteria_access_token")).toBe("test-token-123");
    expect(getTokenExpiry()).toEqual(expect.any(Number));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
  });

  it("limpia el token cuando se pasa null", () => {
    setAccessToken("test-token");
    dispatchSpy.mockClear();
    setAccessToken(null);
    expect(sessionStorage.getItem("ferreteria_access_token")).toBeNull();
    expect(sessionStorage.getItem("ferreteria_token_expiry")).toBeNull();
  });

  it("lee un token vigente sin emitir eventos ni limpiar storage", () => {
    sessionStorage.setItem("ferreteria_access_token", "valid-token");
    sessionStorage.setItem("ferreteria_token_expiry", String(Date.now() + 60_000));
    expect(getAccessToken()).toBe("valid-token");
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("lee un token expirado de forma pura", () => {
    sessionStorage.setItem("ferreteria_access_token", "expired-token");
    sessionStorage.setItem("ferreteria_token_expiry", String(Date.now() - 1_000));
    expect(getAccessToken()).toBeNull();
    expect(sessionStorage.getItem("ferreteria_access_token")).toBe("expired-token");
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("expira explícitamente un token vencido desde el interceptor", () => {
    sessionStorage.setItem("ferreteria_access_token", "expired-token");
    sessionStorage.setItem("ferreteria_token_expiry", String(Date.now() - 1_000));
    expect(expireIfNeeded()).toBe(true);
    expect(sessionStorage.getItem("ferreteria_access_token")).toBeNull();
    expect(dispatchSpy).toHaveBeenCalledTimes(2);
  });

  it("deriva la expiración del claim exp del JWT", () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    setAccessToken(`header.${payload}.signature`);
    expect(getTokenExpiry()).toBeGreaterThan(Date.now() + 3_500_000);
    expect(isTokenExpired()).toBe(false);
  });

  it("considera expirado un token sin timestamp", () => {
    expect(isTokenExpired()).toBe(true);
    expect(getTokenExpiry()).toBeNull();
  });
});
