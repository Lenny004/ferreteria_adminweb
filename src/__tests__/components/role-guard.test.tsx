/**
 * Pruebas para RoleGuard: protección por rol de usuario.
 */

import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/role-guard";
import { useSession } from "@/contexts/session-context";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/contexts/session-context", () => ({
  useSession: jest.fn(),
}));

describe("RoleGuard", () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
  });

  it("debe mostrar pantalla de carga mientras verifica", () => {
    (useSession as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    });

    render(
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div>Contenido admin</div>
      </RoleGuard>
    );

    expect(screen.getByText(/verificando permisos/i)).toBeInTheDocument();
  });

  it("debe renderizar children si el usuario tiene el rol permitido", () => {
    (useSession as jest.Mock).mockReturnValue({
      user: { id: "1", name: "Admin", email: "admin@test.com", role: "ADMIN" },
      isLoading: false,
    });

    render(
      <RoleGuard allowedRoles={["ADMIN", "OWNER"]}>
        <div>Contenido admin</div>
      </RoleGuard>
    );

    expect(screen.getByText("Contenido admin")).toBeInTheDocument();
  });

  it("debe mostrar mensaje de acceso denegado si el rol no está permitido", () => {
    (useSession as jest.Mock).mockReturnValue({
      user: { id: "1", name: "User", email: "user@test.com", role: "ACCOUNTANT" },
      isLoading: false,
    });

    render(
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div>Contenido admin</div>
      </RoleGuard>
    );

    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument();
    expect(screen.queryByText("Contenido admin")).not.toBeInTheDocument();
  });

  it("debe renderizar fallback personalizado si el rol no está permitido", () => {
    (useSession as jest.Mock).mockReturnValue({
      user: { id: "1", name: "User", email: "user@test.com", role: "ACCOUNTANT" },
      isLoading: false,
    });

    render(
      <RoleGuard
        allowedRoles={["ADMIN"]}
        fallback={<div>Fallback personalizado</div>}
      >
        <div>Contenido admin</div>
      </RoleGuard>
    );

    expect(screen.getByText("Fallback personalizado")).toBeInTheDocument();
    expect(screen.queryByText("Contenido admin")).not.toBeInTheDocument();
  });

  it("debe retornar null si no hay usuario", () => {
    (useSession as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    });

    const { container } = render(
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div>Contenido admin</div>
      </RoleGuard>
    );

    expect(container.firstChild).toBeNull();
  });
});
