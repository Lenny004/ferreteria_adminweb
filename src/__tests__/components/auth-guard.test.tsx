/** Pruebas del guard admin sin token local. */

import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { getMe } from "@/lib/api/auth";

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/lib/api/auth", () => ({ getMe: jest.fn() }));

describe("AuthGuard", () => {
  const replace = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace });
  });

  it("no muestra contenido protegido mientras getMe carga", () => {
    (getMe as jest.Mock).mockReturnValue(new Promise(() => undefined));
    render(<AuthGuard><div>Contenido protegido</div></AuthGuard>);
    expect(screen.getByText(/verificando sesión/i)).toBeInTheDocument();
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it("redirige a login sin sesión válida", async () => {
    (getMe as jest.Mock).mockRejectedValue(new Error("UNAUTHORIZED"));
    render(<AuthGuard><div>Contenido protegido</div></AuthGuard>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it("monta hijos después de getMe válido", async () => {
    (getMe as jest.Mock).mockResolvedValue({ id: "1", role: "ADMIN" });
    render(<AuthGuard><div>Contenido protegido</div></AuthGuard>);
    await waitFor(() => expect(screen.getByText("Contenido protegido")).toBeInTheDocument());
  });
});
