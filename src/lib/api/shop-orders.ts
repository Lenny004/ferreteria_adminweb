/**
 * Pedidos de cliente de tienda — cliente HTTP hacia `/shop/orders` (JWT rol SHOP).
 */

import { apiRequest } from "@/lib/api";
import { getShopAccessToken } from "@/lib/api/shop-auth";
import type { ShopCustomer } from "@/lib/api/shop-auth";

export type ShopOrderStatus =
  | "PENDIENTE"
  | "CONFIRMADA"
  | "LISTA_RETIRO"
  | "ENTREGADA"
  | "CANCELADA";

export type ShopOrderPaymentStatus =
  | "PENDIENTE"
  | "PAGADO"
  | "REEMBOLSADO"
  | "FALLIDO";

/** Estado del registro ShopPayment (distinto del paymentStatus del pedido). */
export type ShopPaymentRecordStatus =
  | "PENDIENTE"
  | "COMPLETADO"
  | "FALLIDO"
  | "REEMBOLSADO";

/** @deprecated Usar ShopOrderPaymentStatus */
export type ShopPaymentStatus = ShopOrderPaymentStatus;

export type ShopPaymentMethod =
  | "EFECTIVO_RETIRO"
  | "TRANSFERENCIA"
  | "TARJETA"
  | "CONTRA_ENTREGA";

export type ShopDeliveryType = "RETIRO_TIENDA" | "ENVIO";

export type ShopOrderLineProduct = {
  id: string;
  code: string;
  description: string;
};

export type ShopOrderLine = {
  id: string;
  shopOrderId: string;
  productId: string;
  quantity: string | number;
  unitPrice: string | number;
  subtotal: string | number;
  product: ShopOrderLineProduct;
};

export type ShopPayment = {
  id: string;
  shopOrderId: string;
  method: ShopPaymentMethod;
  amount: string | number;
  status: ShopPaymentRecordStatus;
  providerRef?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShopOrder = {
  id: string;
  shopCustomerId: string;
  status: ShopOrderStatus;
  subtotal: string | number;
  taxAmount: string | number;
  total: string | number;
  deliveryType: ShopDeliveryType;
  shippingAddress?: string | null;
  paymentStatus: ShopOrderPaymentStatus;
  paymentMethod?: ShopPaymentMethod | null;
  customerNotes?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  lines: ShopOrderLine[];
  payments?: ShopPayment[];
  shopCustomer?: ShopCustomer;
};

export type CheckoutInput = {
  customerNotes?: string | null;
  deliveryType?: ShopDeliveryType;
  shippingAddress?: string | null;
  paymentMethod?: ShopPaymentMethod;
};

export type PayOrderInput = {
  method: ShopPaymentMethod;
  providerRef?: string | null;
  notes?: string | null;
};

function shopRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; headers?: HeadersInit } = {},
): Promise<T> {
  const { body, method, headers } = options;
  return apiRequest<T>(path, {
    method,
    headers,
    token: getShopAccessToken(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Checkout, historial y pagos de pedidos del cliente de tienda. */
export const shopOrdersApi = {
  /** Convierte el carrito actual en un pedido. */
  checkout: (data: CheckoutInput = {}) =>
    shopRequest<ShopOrder>("/shop/orders/checkout", {
      method: "POST",
      body: data,
    }),

  /** Historial de pedidos del cliente autenticado. */
  listOrders: () => shopRequest<ShopOrder[]>("/shop/orders", { method: "GET" }),

  /** Detalle de un pedido propio. */
  getOrder: (id: string) =>
    shopRequest<ShopOrder>(`/shop/orders/${id}`, { method: "GET" }),

  /** Registra o simula el pago de un pedido. */
  payOrder: (id: string, data: PayOrderInput) =>
    shopRequest<ShopOrder>(`/shop/orders/${id}/pay`, {
      method: "POST",
      body: data,
    }),
};
