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
  type ShopOrderAdminPayment,
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

/**
 * Obtiene el pago pendiente más reciente, el mismo que usa el backend al confirmar.
 * Los pagos del backend llegan ordenados del más reciente al más antiguo; su
 * `customerReference` (o `null`) es la referencia que el personal ve y envía como esperada.
 *
 * @param order - Pedido cuyos pagos se muestran en el panel.
 * @returns Pago pendiente más reciente o `null` si el pedido no tiene pagos pendientes.
 */
function latestPendingCustomerReferencePayment(order: ShopOrderAdmin): ShopOrderAdminPayment | null {
  return (order.payments ?? []).find((payment) => payment.status === "PENDIENTE") ?? null;
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
  const [cancellationNote, setCancellationNote] = useState("");

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
        invalidateOrders();
        void query.refetch();
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: "CANCELADA"; cancellationNote?: string } }) =>
      adminShopOrdersApi.update(id, data),
    onSuccess: () => {
      invalidateOrders();
      setCancelTarget(null);
      setCancellationNote("");
      toast.success("Pedido cancelado");
    },
    onError: async (error) => {
      toast.error(error instanceof ApiError ? error.message : "No se pudo cancelar el pedido");
      if (!(error instanceof ApiError) || error.status !== 409) return;

      const targetId = cancelTarget?.id;
      try {
        await queryClient.invalidateQueries({ queryKey: ["admin-shop-orders"] });
        const refreshed = await query.refetch();
        const freshOrder = refreshed?.data?.items.find((order) => order.id === targetId);
        const remainsCancelable = freshOrder
          && freshOrder.status !== "CANCELADA"
          && freshOrder.status !== "ENTREGADA"
          && freshOrder.paymentStatus !== "PAGADO";

        if (freshOrder && remainsCancelable && freshOrder.paymentStatus === "EN_VERIFICACION") {
          setCancelTarget(freshOrder);
          setCancellationNote("");
          toast.info("El pago de este pedido pasó a verificación: agrega una nota para cancelarlo");
          return;
        }
      } catch {
        // Si no se puede confirmar el estado actual, se cierra el diálogo por seguridad.
      }
      resetCancellationModal();
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

  /**
   * Abre el diálogo de cancelación con una nota nueva para el pedido seleccionado.
   *
   * @param order - Pedido que se va a cancelar.
   */
  function openCancellationModal(order: ShopOrderAdmin) {
    setCancelTarget(order);
    setCancellationNote("");
  }

  /**
   * Cierra el diálogo de cancelación y elimina la nota temporal del formulario.
   */
  function resetCancellationModal() {
    setCancelTarget(null);
    setCancellationNote("");
  }

  /**
   * Envía la cancelación con la nota adicional solo cuando el pago está en verificación.
   */
  function submitCancellation() {
    if (!cancelTarget) return;

    const requiresCancellationNote = cancelTarget.paymentStatus === "EN_VERIFICACION";
    const trimmedNote = cancellationNote.trim();
    if (requiresCancellationNote && !trimmedNote) return;

    const data: { status: "CANCELADA"; cancellationNote?: string } = { status: "CANCELADA" };
    if (requiresCancellationNote) {
      data.cancellationNote = trimmedNote;
    }
    cancelMutation.mutate({ id: cancelTarget.id, data });
  }

  function submitPayment(event: FormEvent) {
    event.preventDefault();
    if (!paymentTarget) return;
    const latestPayment = latestPendingCustomerReferencePayment(paymentTarget);
    const data: ConfirmPaymentInput = {
      method: paymentTarget.paymentMethod ?? undefined,
      providerRef: providerRef.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
      expectedCustomerReference: latestPayment?.customerReference ?? null,
      expectedCustomerReferenceAt: latestPayment?.customerReferenceAt ?? null,
    };
    confirmMutation.mutate({ id: paymentTarget.id, data });
  }

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const paymentReference = paymentTarget ? latestPendingCustomerReferencePayment(paymentTarget) : null;

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
                    const canCancel = order.status !== "CANCELADA" && order.status !== "ENTREGADA" && order.paymentStatus !== "PAGADO";
                    const latestPayment = latestPendingCustomerReferencePayment(order);
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
                        <td>{latestPayment?.customerReference ?? "—"}</td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            {canConfirm ? <Button size="sm" onClick={() => openPaymentModal(order)}>Confirmar pago</Button> : null}
                            {canCancel ? <Button size="sm" variant="outline" onClick={() => openCancellationModal(order)}>Cancelar pedido</Button> : null}
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
              <p>Referencia del cliente: {paymentReference?.customerReference ?? "No enviada"}</p>
              <p>Fecha/hora de la referencia: {paymentReference?.customerReferenceAt ? formatDateTime(paymentReference.customerReferenceAt) : "No registrada"}</p>
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
        onOpenChange={(open) => { if (!open && !cancelMutation.isPending) resetCancellationModal(); }}
        title="Cancelar pedido"
        description="Se cancelará el pedido y las unidades vendidas volverán al inventario. Esta acción no se puede deshacer desde el panel."
        size="md"
      >
        {cancelTarget ? (
          <div className="grid gap-4 text-sm">
            <p>¿Confirmas cancelar el pedido de <strong>{cancelTarget.shopCustomer?.fullName ?? "este cliente"}</strong> por {formatMoney(cancelTarget.total)}?</p>
            {cancelTarget.paymentStatus === "EN_VERIFICACION" ? (
              <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-950">
                Este pedido tiene un pago en verificación. Revisa la referencia del cliente antes de cancelar e indica el motivo.
              </div>
            ) : null}
            {cancelTarget.paymentStatus === "EN_VERIFICACION" ? (
              <label className="grid gap-1 text-sm">
                <span>Nota de cancelación</span>
                <textarea
                  aria-label="Nota de cancelación"
                  className="min-h-20 rounded-md border border-border px-3 py-2"
                  value={cancellationNote}
                  required
                  maxLength={300}
                  onChange={(event) => setCancellationNote(event.target.value)}
                />
              </label>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetCancellationModal}>Cerrar</Button>
              <Button
                type="button"
                variant="outline"
                disabled={cancelMutation.isPending || (cancelTarget.paymentStatus === "EN_VERIFICACION" && !cancellationNote.trim())}
                onClick={submitCancellation}
              >
                {cancelMutation.isPending ? "Cancelando…" : "Cancelar pedido"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

