/**
 * Cliente administrativo para consultar y gestionar pedidos originados en la tienda.
 */

import { api } from "@/lib/api";
import type {
  ShopOrderPaymentStatus,
  ShopOrderStatus,
  ShopPaymentMethod,
  ShopPaymentRecordStatus,
} from "@/lib/api/shop-orders";

/** Cliente de tienda visible para el personal autorizado del panel. */
export type ShopOrderAdminCustomer = {
  fullName: string;
  email: string;
  phone?: string | null;
};

/** Línea de un pedido, con el producto necesario para identificarla en el panel. */
export type ShopOrderAdminLine = {
  id: string;
  productId: string;
  quantity: string | number;
  unitPrice: string | number;
  subtotal: string | number;
  product?: {
    id: string;
    code: string;
    description: string;
  };
};

/** Registro de pago incluido en el detalle administrativo del pedido. */
export type ShopOrderAdminPayment = {
  id: string;
  shopOrderId?: string;
  method: ShopPaymentMethod;
  amount: string | number;
  status: ShopPaymentRecordStatus;
  providerRef?: string | null;
  customerReference?: string | null;
  customerReferenceAt?: string | null;
  notes?: string | null;
  confirmedAt?: string | null;
  confirmedByWebUserId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** Pedido de tienda devuelto por los endpoints administrativos. */
export type ShopOrderAdmin = {
  id: string;
  status: ShopOrderStatus;
  subtotal: string | number;
  taxAmount: string | number;
  total: string | number;
  paymentStatus: ShopOrderPaymentStatus;
  paymentMethod?: ShopPaymentMethod | null;
  adminNotes?: string | null;
  customerNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  shopCustomer?: ShopOrderAdminCustomer | null;
  lines?: ShopOrderAdminLine[];
  payments?: ShopOrderAdminPayment[];
};

/** Parámetros admitidos por el listado administrativo de pedidos. */
export type ListShopOrdersParams = {
  status?: ShopOrderStatus;
  paymentStatus?: ShopOrderPaymentStatus;
  q?: string;
  take?: number;
  skip?: number;
};

/** Respuesta paginada del listado administrativo de pedidos. */
export type ListShopOrdersResponse = {
  items: ShopOrderAdmin[];
  total: number;
  take: number;
  skip: number;
};

/** Cambios permitidos al estado o las notas internas del pedido. */
export type UpdateShopOrderInput = {
  status?: ShopOrderStatus;
  adminNotes?: string | null;
};

/** Datos opcionales que acompañan la confirmación de un pago. */
export type ConfirmPaymentInput = {
  method?: ShopPaymentMethod;
  providerRef?: string;
  notes?: string;
  /** Referencia que el panel mostró al usuario al abrir la confirmación. */
  expectedCustomerReference?: string | null;
  /** Fecha de la referencia que el panel mostró al usuario. */
  expectedCustomerReferenceAt?: string | null;
};

function buildQuery(params?: ListShopOrdersParams): string {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.paymentStatus) search.set("paymentStatus", params.paymentStatus);
  if (params?.q) search.set("q", params.q);
  if (params?.take !== undefined) search.set("take", String(params.take));
  if (params?.skip !== undefined) search.set("skip", String(params.skip));
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** Operaciones administrativas disponibles para pedidos de tienda. */
export const adminShopOrdersApi = {
  /** Lista pedidos con filtros y paginación `take/skip`. */
  list: (params?: ListShopOrdersParams) =>
    api.get<ListShopOrdersResponse>(`/shop-orders${buildQuery(params)}`),

  /** Obtiene el detalle de un pedido, incluidos cliente, líneas y pagos. */
  getById: (id: string) => api.get<ShopOrderAdmin>(`/shop-orders/${id}`),

  /** Actualiza el estado o las notas internas de un pedido. */
  update: (id: string, data: UpdateShopOrderInput) =>
    api.patch<ShopOrderAdmin>(`/shop-orders/${id}`, data),

  /** Confirma manualmente un pago desde la sesión autenticada del panel. */
  confirmPayment: (id: string, data?: ConfirmPaymentInput) =>
    api.post<ShopOrderAdmin>(`/shop/orders/${id}/pay`, data),
};
