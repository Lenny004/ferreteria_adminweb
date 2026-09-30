/** Pruebas de login/logout admin con cookie httpOnly y CSRF en memoria. */

import { login, logout } from "@/lib/api/auth";
import { clearCsrfToken, getCsrfToken, getSessionUser, setCsrfToken } from "@/lib/session-state";

global.fetch = jest.fn();

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

describe("auth API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCsrfToken();
  });

  it("ignora accessToken y guarda usuario/CSRF en memoria", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response({
      success: true,
      data: {
        accessToken: "no-debe-usarse",
        csrfToken: "csrf-login",
        user: { id: "1", username: "admin", email: "a@test", role: "ADMIN" },
      },
    }));
    await login("admin", "secret");
    expect(getCsrfToken()).toBe("csrf-login");
    expect(getSessionUser()).toMatchObject({ id: "1", role: "ADMIN" });
    expect((fetch as jest.Mock).mock.calls[0][1].headers.get("Authorization")).toBeNull();
  });

  it("llama logout con CSRF y limpia estado aunque falle", async () => {
    setCsrfToken("csrf-logout");
    (fetch as jest.Mock).mockResolvedValueOnce(response({ error: "UNAUTHORIZED" }, 401));
    await expect(logout()).rejects.toThrow();
    expect((fetch as jest.Mock).mock.calls[0][0]).toContain("/auth/logout");
    expect((fetch as jest.Mock).mock.calls[0][1].headers.get("X-CSRF-Token")).toBe("csrf-logout");
    expect(getCsrfToken()).toBeNull();
    expect(getSessionUser()).toBeNull();
  });
});
