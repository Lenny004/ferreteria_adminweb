import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CheckoutPage from "@/app/(store)/tienda/checkout/page";
import { shopOrdersApi } from "@/lib/api/shop-orders";
import { useShopSession } from "@/hooks/use-shop-session";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/hooks/use-shop-session", () => ({
  useShopSession: jest.fn(),
}));

jest.mock("@/lib/api/cart", () => ({
  cartApi: { getCart: jest.fn() },
}));

jest.mock("@/lib/api/shop-orders", () => ({
  shopOrdersApi: { checkout: jest.fn(), payOrder: jest.fn() },
}));

const useQueryMock = useQuery as jest.Mock;
const useMutationMock = useMutation as jest.Mock;
const checkoutMock = shopOrdersApi.checkout as jest.Mock;
const payOrderMock = (shopOrdersApi as typeof shopOrdersApi & { payOrder: jest.Mock }).payOrder;

describe("checkout de tienda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useShopSession as jest.Mock).mockReturnValue({ status: "authenticated" });
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: jest.fn() });
    useQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [{
          id: "line-1",
          quantity: "1",
          product: { description: "Tornillo", salePrice: "2.00" },
        }],
        subtotal: "2.00",
      },
    });
    checkoutMock.mockResolvedValue({ id: "order-1", paymentStatus: "PENDIENTE" });
    useMutationMock.mockImplementation(({ mutationFn, onSuccess, onError }) => ({
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

  it("no llama a /pay al confirmar con TARJETA", async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);

    await user.click(screen.getByRole("radio", { name: "Tarjeta de crédito/débito" }));
    expect(screen.getByText(/pago en línea aún no está disponible/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar pedido" }));
    expect(checkoutMock).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Confirmar pedido" }));

    await waitFor(() => expect(checkoutMock).toHaveBeenCalledWith(expect.objectContaining({ paymentMethod: "TARJETA" })));
    expect(payOrderMock).not.toHaveBeenCalled();
  });
});
