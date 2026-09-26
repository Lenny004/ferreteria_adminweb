/** Pruebas del estado efímero y migración desde el modelo JWT anterior. */

import {
  clearCsrfToken,
  ensureCsrfToken,
  getCsrfToken,
  migrateLegacySessionStorage,
  setCsrfToken,
} from "@/lib/session-state";

describe("session-state", () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearCsrfToken();
  });

  it("borra las claves antiguas de sessionStorage", () => {
    sessionStorage.setItem("ferreteria_access_token", "legacy");
    sessionStorage.setItem("ferreteria_token_expiry", "123");
    migrateLegacySessionStorage();
    expect(sessionStorage.getItem("ferreteria_access_token")).toBeNull();
    expect(sessionStorage.getItem("ferreteria_token_expiry")).toBeNull();
  });

  it("conserva CSRF únicamente en memoria", () => {
    setCsrfToken("csrf");
    expect(getCsrfToken()).toBe("csrf");
    expect(sessionStorage.length).toBe(0);
  });

  it("deduplica la promesa en vuelo", async () => {
    let calls = 0;
    const request = async () => {
      calls += 1;
      await Promise.resolve();
      return "csrf-dedup";
    };
    await Promise.all([ensureCsrfToken(request), ensureCsrfToken(request)]);
    expect(calls).toBe(1);
  });
});
