/** Pruebas del proveedor de sesión derivado de `/auth/me`. */

import { act, render } from "@testing-library/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { SESSION_EXPIRED_LOGIN_PATH, SessionProvider } from "@/contexts/session-context";

jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn(), useQueryClient: jest.fn() }));
jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));

describe("SessionProvider", () => {
  const replace = jest.fn();
  const clear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    (useRouter as jest.Mock).mockReturnValue({ replace });
    (useQueryClient as jest.Mock).mockReturnValue({ clear });
    (useQuery as jest.Mock).mockReturnValue({ data: null, isLoading: true });
  });

  it("consulta /auth/me sin depender de token local y no entra en bucle", () => {
    let renders = 0;
    render(<SessionProvider><span>{++renders}</span></SessionProvider>);
    expect(useQuery).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["auth", "me"], retry: false }));
    expect(renders).toBeLessThanOrEqual(2);
  });

  it("borra las claves del JWT antiguo al montar", () => {
    sessionStorage.setItem("ferreteria_access_token", "viejo");
    sessionStorage.setItem("ferreteria_token_expiry", "1");
    render(<SessionProvider><span /></SessionProvider>);
    expect(sessionStorage.getItem("ferreteria_access_token")).toBeNull();
    expect(sessionStorage.getItem("ferreteria_token_expiry")).toBeNull();
  });

  it("ante 'unauthorized' descarta la caché y redirige con aviso de sesión expirada", () => {
    render(<SessionProvider><span /></SessionProvider>);
    act(() => { window.dispatchEvent(new Event("unauthorized")); });
    expect(clear).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(SESSION_EXPIRED_LOGIN_PATH);
  });
});