"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useShopSession } from "@/hooks/use-shop-session";
import {
  shopOrdersApi,
  type ShopDeliveryType,
  type ShopOrderPaymentStatus,
  type ShopOrderStatus,
  type ShopPaymentMethod,
  type ShopPaymentRecordStatus,
} from "@/lib/api/shop-orders";
import { formatDateTime, formatMoney } from "@/lib/utils";

const ORDER_STATUS_LABELS: Record<ShopOrderStatus, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  LISTA_RETIRO: "Lista para retiro",
  ENTREGADA: "Entregada",
  CANCELADA: "Cancelada",
};

const ORDER_PAYMENT_STATUS_LABELS: Record<ShopOrderPaymentStatus, string> = {
  PENDIENTE: "Pago pendiente",
  EN_VERIFICACION: "Pago en verificación",
  PAGADO: "Pagado",
  REEMBOLSADO: "Reembolsado",
  FALLIDO: "Pago fallido",
};

const PAYMENT_RECORD_STATUS_LABELS: Record<ShopPaymentRecordStatus, string> = {
  PENDIENTE: "Pendiente",
  COMPLETADO: "Completado",
  REEMBOLSADO: "Reembolsado",
  FALLIDO: "Fallido",
};

const PAYMENT_METHOD_LABELS: Record<ShopPaymentMethod, string> = {
  EFECTIVO_RETIRO: "Efectivo en retiro",
  TRANSFERENCIA: "Transferencia bancaria",
  TARJETA: "Tarjeta",
  CONTRA_ENTREGA: "Contra entrega",
};

const DELIVERY_TYPE_LABELS: Record<ShopDeliveryType, string> = {
  RETIRO_TIENDA: "Retiro en tienda",
  ENVIO: "Envío a domicilio",
};

function orderStatusVariant(
  status: ShopOrderStatus,
): "default" | "success" | "warning" | "muted" | "danger" {
  switch (status) {
    case "PENDIENTE":
      return "warning";
    case "CONFIRMADA":
      return "default";
    case "LISTA_RETIRO":
      return "default";
    case "ENTREGADA":
      return "success";
    case "CANCELADA":
      return "danger";
    default:
      return "muted";
  }
}

function orderPaymentStatusVariant(
  status: ShopOrderPaymentStatus,
): "default" | "success" | "warning" | "muted" | "danger" {
  switch (status) {
    case "PENDIENTE":
      return "warning";
    case "EN_VERIFICACION":
      return "warning";
    case "PAGADO":
      return "success";
    case "REEMBOLSADO":
      return "muted";
    case "FALLIDO":
      return "danger";
    default:
      return "muted";
  }
}

function paymentRecordStatusVariant(
  status: ShopPaymentRecordStatus,
): "default" | "success" | "warning" | "muted" | "danger" {
  switch (status) {
    case "PENDIENTE":
      return "warning";
    case "COMPLETADO":
      return "success";
    case "REEMBOLSADO":
      return "muted";
    case "FALLIDO":
      return "danger";
    default:
      return "muted";
  }
}

/** Detalle y pago de un pedido propio del cliente de tienda. */
export default function PedidoDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { status } = useShopSession();
  const loggedIn = status === "authenticated";
  const ready = status !== "loading";

  const orderQuery = useQuery({
    queryKey: ["shop-order", id],
    queryFn: () => shopOrdersApi.getOrder(id),
    enabled: loggedIn && Boolean(id),
    retry: false,
  });
  const queryClient = useQueryClient();
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const transferMutation = useMutation({
    mutationFn: (data: { reference: string; notes?: string }) =>
      shopOrdersApi.submitTransferReference(id, data),
    onSuccess: (_order, variables) => {
      setSubmittedReference(variables.reference);
      void queryClient.invalidateQueries({ queryKey: ["shop-order", id] });
      void queryClient.invalidateQueries({ queryKey: ["shop-orders"] });
      toast.success("Referencia enviada para verificación");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo enviar la referencia");
    },
  });

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!loggedIn) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Detalle del pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Inicia sesión para ver el detalle de tu pedido.</p>
          <Button asChild>
            <Link href="/tienda/login">Ingresar</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (orderQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando pedido…</p>;
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-sm text-primary">Pedido no encontrado.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/tienda/pedidos">← Mis pedidos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/tienda">Catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  const order = orderQuery.data;
  const payments = order.payments ?? [];
  const confirmedPayment = payments.find((payment) => payment.confirmedAt);
  const transferPayment = [...payments]
    .reverse()
    .find((payment) => payment.method === "TRANSFERENCIA" && payment.customerReference);
  const transferReference = submittedReference ?? transferPayment?.customerReference ?? null;
  const canSubmitTransfer = order.paymentMethod === "TRANSFERENCIA" &&
    (order.paymentStatus === "PENDIENTE" || order.paymentStatus === "EN_VERIFICACION") &&
    order.status !== "CANCELADA";

  function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reference = String(form.get("reference") ?? "").trim();
    const notes = String(form.get("notes") ?? "").trim();
    if (reference.length < 3 || reference.length > 100) {
      toast.error("La referencia debe tener entre 3 y 100 caracteres");
      return;
    }
    if (notes.length > 300) {
      toast.error("Las notas no pueden superar 300 caracteres");
      return;
    }
    transferMutation.mutate({ reference, notes: notes || undefined });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/tienda/pedidos">← Mis pedidos</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/tienda">Catálogo</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Pedido #{order.id.slice(0, 8)}</h1>
        <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant={orderStatusVariant(order.status)}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
          <Badge variant={orderPaymentStatusVariant(order.paymentStatus)}>
            {ORDER_PAYMENT_STATUS_LABELS[order.paymentStatus]}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {order.lines.length === 0 ? (
            <p className="text-muted-foreground">Sin líneas de detalle.</p>
          ) : (
            <ul className="divide-y divide-border">
              {order.lines.map((line) => (
                <li key={line.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium">{line.product.description}</p>
                    <p className="text-muted-foreground">{line.product.code}</p>
                    <p className="text-muted-foreground">
                      {Number(line.quantity)} × {formatMoney(line.unitPrice)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatMoney(line.subtotal)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Totales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IVA</span>
            <span>{formatMoney(order.taxAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatMoney(order.total)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entrega</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Tipo</p>
            <p className="font-medium">{DELIVERY_TYPE_LABELS[order.deliveryType]}</p>
          </div>
          {order.deliveryType === "ENVIO" ? (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground">Dirección de envío</p>
              <p className="font-medium">{order.shippingAddress?.trim() || "—"}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pago</CardTitle>
          <CardDescription>
            {order.paymentMethod
              ? PAYMENT_METHOD_LABELS[order.paymentMethod]
              : "Método no especificado"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant={orderPaymentStatusVariant(order.paymentStatus)}>
              {ORDER_PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </Badge>
            {order.paymentMethod ? (
              <Badge variant="muted">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Badge>
            ) : null}
          </div>

          {payments.length > 0 ? (
            <div className="space-y-2">
              <p className="font-medium">Historial de pagos</p>
              <ul className="divide-y divide-border rounded-md border border-border">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <div>
                      <p>{PAYMENT_METHOD_LABELS[payment.method]}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(payment.createdAt)}
                        {payment.providerRef ? ` · Ref: ${payment.providerRef}` : ""}
                      </p>
                      {payment.notes ? (
                        <p className="text-xs text-muted-foreground">{payment.notes}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatMoney(payment.amount)}</p>
                      <Badge variant={paymentRecordStatusVariant(payment.status)} className="mt-1">
                        {PAYMENT_RECORD_STATUS_LABELS[payment.status]}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground">Sin registros de pago aún.</p>
          )}

          {order.paymentStatus === "PENDIENTE" ? (
            <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-muted-foreground">
              <p className="font-medium text-foreground">Pendiente de confirmación</p>
              <p>Pedido recibido. Pago pendiente de confirmación por la tienda.</p>
              <p>
                {order.paymentMethod === "TRANSFERENCIA"
                  ? "Realiza la transferencia y envía el comprobante a la tienda por el canal indicado por el personal."
                  : order.paymentMethod === "TARJETA"
                    ? "El pago en línea aún no está disponible porque la pasarela está pendiente. El personal confirmará el pago al retirar o entregar."
                    : order.paymentMethod === "EFECTIVO_RETIRO"
                      ? "Pagarás en efectivo al retirar el pedido en la tienda."
                      : "Pagarás al recibir el pedido."}
              </p>
            </div>
          ) : null}
          {order.paymentStatus === "EN_VERIFICACION" || submittedReference ? (
            <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-muted-foreground">
              <p className="font-medium text-foreground">Pago pendiente de verificación por la tienda</p>
              <p>Este pedido NO está pagado hasta que la tienda confirme la transferencia.</p>
              {transferReference ? <p>Referencia enviada: <strong>{transferReference}</strong></p> : null}
            </div>
          ) : null}
          {canSubmitTransfer ? (
            <form className="grid gap-3 rounded-md border border-border p-3" onSubmit={submitTransfer}>
              <div>
                <p className="font-medium">¿Ya transferiste?</p>
                <p className="text-muted-foreground">Envía la referencia para que la tienda revise tu pago. El pedido NO se marca como pagado automáticamente.</p>
              </div>
              <label className="grid gap-1">
                <span>Referencia de transferencia *</span>
                <input
                  name="reference"
                  required
                  minLength={3}
                  maxLength={100}
                  defaultValue={transferReference ?? ""}
                  className="h-10 rounded-md border border-border px-3"
                />
              </label>
              <label className="grid gap-1">
                <span>Notas (opcional)</span>
                <textarea name="notes" maxLength={300} className="min-h-20 rounded-md border border-border px-3 py-2" />
              </label>
              <Button type="submit" disabled={transferMutation.isPending}>
                {transferMutation.isPending ? "Enviando…" : "Enviar referencia"}
              </Button>
            </form>
          ) : null}
          {order.paymentStatus === "PAGADO" ? (
            <p className="rounded-md border border-success/30 bg-success/10 p-3 text-success">
              Pago confirmado{confirmedPayment?.confirmedAt ? ` el ${formatDateTime(confirmedPayment.confirmedAt)}` : "."}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {order.customerNotes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas del pedido</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{order.customerNotes}</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
