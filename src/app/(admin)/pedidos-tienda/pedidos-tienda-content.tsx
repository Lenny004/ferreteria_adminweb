"use client";

/**
 * Lista pedidos de tienda y permite confirmar pagos o cancelar pedidos elegibles.
 */

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { ApiError } from "@/lib/api";
import {
  adminShopOrdersApi,
  type ConfirmPaymentInput,
  type ShopOrderAdmin,
  type ListShopOrdersParams,
} from "@/lib/api/admin-shop-orders";
import {
  type ShopOrderPaymentStatus,
  type ShopOrderStatus,
  type ShopPaymentMethod,
} from "@/lib/api/shop-orders";
import { formatDateTime, formatMoney } from "@/lib/utils";

const PAGE_SIZE = 20;

const ORDER_STATUS_LABELS: Record<ShopOrderStatus, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  LISTA_RETIRO: "Lista para retiro",
  ENTREGADA: "Entregada",
  CANCELADA: "Cancelada",
};

const PAYMENT_STATUS_LABELS: Record<ShopOrderPaymentStatus, string> = {
  PENDIENTE: "Pago pendiente",
  EN_VERIFICACION: "Pago en verificación",
  PAGADO: "Pagado",
  REEMBOLSADO: "Reembolsado",
  FALLIDO: "Pago fallido",
};

const PAYMENT_METHOD_LABELS: Record<ShopPaymentMethod, string> = {
  EFECTIVO_RETIRO: "Efectivo en retiro",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  CONTRA_ENTREGA: "Contra entrega",
};

const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS) as [ShopOrderStatus, string][];
const PAYMENT_STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_LABELS) as [ShopOrderPaymentStatus, string][];

function orderStatusVariant(status: ShopOrderStatus): BadgeProps["variant"] {
  if (status === "ENTREGADA") return "success";
  if (status === "CANCELADA") return "danger";
  if (status === "PENDIENTE") return "warning";
  return "default";
}

function paymentStatusVariant(status: ShopOrderPaymentStatus): BadgeProps["variant"] {
  if (status === "PAGADO") return "success";
  if (status === "FALLIDO") return "danger";
  if (status === "REEMBOLSADO") return "muted";
  return "warning";
}

function latestCustomerReference(order: ShopOrderAdmin): string | null {
  return [...(order.payments ?? [])]
    .reverse()
    .find((payment) => payment.customerReference?.trim())?.customerReference ?? null;
}

type PaymentTarget = ShopOrderAdmin | null;

/**
 * Gestiona el listado, filtros y acciones de los pedidos de tienda del panel.
 *
 * @returns Pantalla administrativa de pedidos con paginación y modales de confirmación.
 */
export default function PedidosTiendaContent() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({ q: "", status: "" as ShopOrderStatus | "", paymentStatus: "" as ShopOrderPaymentStatus | "" });
  const [filters, setFilters] = useState<ListShopOrdersParams>({});
  const [page, setPage] = useState(0);
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget>(null);
  const [cancelTarget, setCancelTarget] = useState<PaymentTarget>(null);
  const [providerRef, setProviderRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const query = useQuery({
    queryKey: ["admin-shop-orders", filters, page],
    queryFn: () => adminShopOrdersApi.list({ ...filters, take: PAGE_SIZE, skip: page * PAGE_SIZE }),
  });

  function invalidateOrders() {
    void queryClient.invalidateQueries({ queryKey: ["admin-shop-orders"] });
  }

  const confirmMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ConfirmPaymentInput }) =>
      adminShopOrdersApi.confirmPayment(id, data),
    onSuccess: () => {
      invalidateOrders();
      setPaymentTarget(null);
      setProviderRef("");
      setPaymentNotes("");
      toast.success("Pago confirmado");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "No se pudo confirmar el pago");
      if (error instanceof ApiError && error.status === 409) {
        // El pedido cambió en el servidor (ya pagado o cancelado): cerrar y refrescar el listado.
        setPaymentTarget(null);
        void query.refetch();
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminShopOrdersApi.update(id, { status: "CANCELADA" }),
    onSuccess: () => {
      invalidateOrders();
      setCancelTarget(null);
      toast.success("Pedido cancelado");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "No se pudo cancelar el pedido");
      if (error instanceof ApiError && error.status === 409) {
        setCancelTarget(null);
        void query.refetch();
      }
    },
  });

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setPage(0);
    setFilters({
      q: draft.q.trim() || undefined,
      status: draft.status || undefined,
      paymentStatus: draft.paymentStatus || undefined,
    });
  }

  function clearFilters() {
    setDraft({ q: "", status: "", paymentStatus: "" });
    setFilters({});
    setPage(0);
  }

  function openPaymentModal(order: ShopOrderAdmin) {
    setPaymentTarget(order);
    setProviderRef("");
    setPaymentNotes("");
  }

  function submitPayment(event: FormEvent) {
    event.preventDefault();
    if (!paymentTarget) return;
    const data: ConfirmPaymentInput = {
      method: paymentTarget.paymentMethod ?? undefined,
      providerRef: providerRef.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
    };
    confirmMutation.mutate({ id: paymentTarget.id, data });
  }

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  return (
    <div className="page-stack">
      <PageHeader
        title="Pedidos de tienda"
        description="Consulta pedidos online y verifica sus pagos desde el panel."
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Busca por pedido o cliente y filtra por estados.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={applyFilters}>
            <label className="grid gap-1 text-sm lg:col-span-2">
              <span className="text-muted-foreground">Búsqueda</span>
              <input
                className="h-10 rounded-md border border-border px-3"
                value={draft.q}
                onChange={(event) => setDraft((current) => ({ ...current, q: event.target.value }))}
                placeholder="Pedido, nombre, correo o teléfono"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Estado</span>
              <select
                className="h-10 rounded-md border border-border px-3"
                value={draft.status}
                onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as ShopOrderStatus | "" }))}
              >
                <option value="">Todos</option>
                {ORDER_STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Estado de pago</span>
              <select
                className="h-10 rounded-md border border-border px-3"
                value={draft.paymentStatus}
                onChange={(event) => setDraft((current) => ({ ...current, paymentStatus: event.target.value as ShopOrderPaymentStatus | "" }))}
              >
                <option value="">Todos</option>
                {PAYMENT_STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
              <Button type="submit" variant="outline">Aplicar</Button>
              <Button type="button" variant="ghost" onClick={clearFilters}>Limpiar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listado ({total})</CardTitle>
        </CardHeader>
        <CardContent className="data-table-wrap">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando pedidos…</p>
          ) : query.isError ? (
            <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay pedidos para mostrar.</p>
          ) : (
            <>
              <table className="data-table min-w-[1080px]">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Pago</th>
                    <th>Método</th>
                    <th>Referencia cliente</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((order) => {
                    const canConfirm = (order.paymentStatus === "PENDIENTE" || order.paymentStatus === "EN_VERIFICACION") && order.status !== "CANCELADA";
                    const canCancel = order.status !== "CANCELADA" && order.paymentStatus !== "PAGADO";
                    return (
                      <tr key={order.id}>
                        <td>{formatDateTime(order.createdAt)}</td>
                        <td>
                          <div className="font-medium">{order.shopCustomer?.fullName ?? "Cliente no disponible"}</div>
                          <div className="text-xs text-muted-foreground">{order.shopCustomer?.email ?? "—"}</div>
                        </td>
                        <td className="font-medium">{formatMoney(order.total)}</td>
                        <td><Badge variant={orderStatusVariant(order.status)}>{ORDER_STATUS_LABELS[order.status]}</Badge></td>
                        <td><Badge variant={paymentStatusVariant(order.paymentStatus)}>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</Badge></td>
                        <td>{order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : "—"}</td>
                        <td>{latestCustomerReference(order) ?? "—"}</td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            {canConfirm ? <Button size="sm" onClick={() => openPaymentModal(order)}>Confirmar pago</Button> : null}
                            {canCancel ? <Button size="sm" variant="outline" onClick={() => setCancelTarget(order)}>Cancelar pedido</Button> : null}
                            {!canConfirm && !canCancel ? "—" : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        open={Boolean(paymentTarget)}
        onOpenChange={(open) => { if (!open && !confirmMutation.isPending) setPaymentTarget(null); }}
        title="Confirmar pago"
        description="El pedido quedará marcado como PAGADO."
        size="md"
      >
        {paymentTarget ? (
          <form className="grid gap-3" onSubmit={submitPayment}>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <p>Total: <strong>{formatMoney(paymentTarget.total)}</strong></p>
              <p>Método: {paymentTarget.paymentMethod ? PAYMENT_METHOD_LABELS[paymentTarget.paymentMethod] : "No especificado"}</p>
              <p>Referencia del cliente: {latestCustomerReference(paymentTarget) ?? "No enviada"}</p>
            </div>
            <label className="grid gap-1 text-sm">
              <span>Referencia final (opcional)</span>
              <input className="h-10 rounded-md border border-border px-3" value={providerRef} maxLength={100} onChange={(event) => setProviderRef(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Notas (opcional)</span>
              <textarea className="min-h-20 rounded-md border border-border px-3 py-2" value={paymentNotes} maxLength={300} onChange={(event) => setPaymentNotes(event.target.value)} />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPaymentTarget(null)}>Cerrar</Button>
              <Button type="submit" disabled={confirmMutation.isPending}>{confirmMutation.isPending ? "Confirmando…" : "Confirmar pago"}</Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => { if (!open && !cancelMutation.isPending) setCancelTarget(null); }}
        title="Cancelar pedido"
        description="Esta acción no se puede deshacer desde el panel."
        size="md"
      >
        {cancelTarget ? (
          <div className="grid gap-4 text-sm">
            <p>¿Confirmas cancelar el pedido de <strong>{cancelTarget.shopCustomer?.fullName ?? "este cliente"}</strong> por {formatMoney(cancelTarget.total)}?</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCancelTarget(null)}>Cerrar</Button>
              <Button type="button" variant="outline" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(cancelTarget.id)}>
                {cancelMutation.isPending ? "Cancelando…" : "Cancelar pedido"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

