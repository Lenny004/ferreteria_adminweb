import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import CarritoPage from "@/app/(store)/tienda/carrito/page";
import { useShopSession } from "@/hooks/use-shop-session";
import { cartApi } from "@/lib/api/cart";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock("@/hooks/use-shop-session", () => ({ useShopSession: jest.fn() }));
jest.mock("@/lib/api/cart", () => ({
  cartApi: {
    getCart: jest.fn(),
    upsertItem: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
  },
}));

describe("carrito de tienda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useShopSession as jest.Mock).mockReturnValue({ status: "authenticated" });
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: jest.fn() });
    (useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [{
          id: "line-1",
          productId: "product-1",
          quantity: "2",
          product: {
            id: "product-1",
            code: "P-1",
            description: "Tornillo galvanizado",
            salePrice: "2.00",
            currentStock: "10",
            measurementType: { unitLabel: "unidad" },
          },
        }],
        subtotal: "4.00",
      },
    });
    (useMutation as jest.Mock).mockImplementation(({ mutationFn, onSuccess, onError }) => ({
      isPending: false,
      mutate: async () => {
        try {
          const result = await mutationFn();
          onSuccess?.(result);
        } catch (error) {
          onError?.(error);
        }
      },
    }));
  });

  it("no vacía el carrito hasta confirmar y cancelar no llama a la API", async () => {
    const user = userEvent.setup();
    render(<CarritoPage />);

    await user.click(screen.getByRole("button", { name: "Vaciar carrito" }));
    expect(cartApi.clearCart).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(cartApi.clearCart).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Vaciar carrito" }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("Tornillo galvanizado");
    await user.click(within(dialog).getByRole("button", { name: "Vaciar carrito" }));

    await waitFor(() => expect(cartApi.clearCart).toHaveBeenCalledTimes(1));
  });
});
