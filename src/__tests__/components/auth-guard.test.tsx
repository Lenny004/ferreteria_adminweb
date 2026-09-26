/**
 * Pruebas para el AuthGuard: verificación de sesión y redirección.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { getAccessToken } from "@/lib/api";
import { getMe, logout } from "@/lib/api/auth";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  getAccessToken: jest.fn(),
}));

jest.mock("@/lib/api/auth", () => ({
  getMe: jest.fn(),
  logout: jest.fn(),
}));

describe("AuthGuard", () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
  });

  it("debe mostrar pantalla de carga inicialmente", () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    (getMe as jest.Mock).mockReturnValue(
      new Promise(() => {})
    );

    render(
      <AuthGuard>
        <div>Contenido protegido</div>
      </AuthGuard>
    );

    expect(screen.getByText(/verificando sesión/i)).toBeInTheDocument();
  });

  it("debe redirigir a login si no hay token", async () => {
    (getAccessToken as jest.Mock).mockReturnValue(null);

    render(
      <AuthGuard>
        <div>Contenido protegido</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("debe redirigir a login si getMe falla", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("invalid-token");
    (getMe as jest.Mock).mockRejectedValue(new Error("Unauthorized"));

    render(
      <AuthGuard>
        <div>Contenido protegido</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("debe renderizar children si la sesión es válida", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("valid-token");
    (getMe as jest.Mock).mockResolvedValue({
      id: "1",
      email: "test@test.com",
      name: "Test User",
      role: "ADMIN",
    });

    render(
      <AuthGuard>
        <div>Contenido protegido</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
    });
  });
});
