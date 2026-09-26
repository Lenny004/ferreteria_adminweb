import { render } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { SessionProvider } from "@/contexts/session-context";
import { setAccessToken } from "@/lib/token-manager";

jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn() }));
jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));

describe("SessionProvider", () => {
  beforeEach(() => {
    sessionStorage.clear();
    setAccessToken(null);
    (useRouter as jest.Mock).mockReturnValue({ replace: jest.fn() });
    (useQuery as jest.Mock).mockReturnValue({ data: null, isLoading: false });
  });

  it("no entra en un bucle de renders después de cerrar sesión", () => {
    let renders = 0;
    render(
      <SessionProvider>
        <span>{++renders}</span>
      </SessionProvider>,
    );
    expect(renders).toBeLessThanOrEqual(2);
  });
});
