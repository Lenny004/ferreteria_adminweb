"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getShopAccessToken } from "@/lib/api/shop-auth";
import {
  shopOrdersApi,
  type ShopOrderStatus,
  type ShopPaymentStatus,
} from "@/lib/api/shop-orders";
import { formatDateTime, formatMoney } from "@/lib/utils";

const ORDER_STATUS_LABELS: Record<ShopOrderStatus, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  LISTA_RETIRO: "Lista para retiro",
  ENTREGADA: "Entregada",
  CANCELADA: "Cancelada",
};

const PAYMENT_STATUS_LABELS: Record<ShopPaymentStatus, string> = {
  PENDIENTE: "Pago pendiente",
  PAGADO: "Pagado",
  REEMBOLSADO: "Reembolsado",
  FALLIDO: "Pago fallido",
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

function paymentStatusVariant(
  status: ShopPaymentStatus,
): "default" | "success" | "warning" | "muted" | "danger" {
  switch (status) {
    case "PENDIENTE":
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

export default function PedidosPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function sync() {
      setLoggedIn(Boolean(getShopAccessToken()));
      setReady(true);
    }
    sync();
    window.addEventListener("shop-token-changed", sync);
    return () => window.removeEventListener("shop-token-changed", sync);
  }, []);

  const query = useQuery({
    queryKey: ["shop-orders"],
    queryFn: () => shopOrdersApi.listOrders(),
    enabled: loggedIn,
    retry: false,
  });

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!loggedIn) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Mis pedidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Inicia sesión para ver el historial de tus pedidos.</p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/tienda/login">Ingresar</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tienda/registro">Crear cuenta</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const orders = query.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mis pedidos</h1>
        <p className="text-sm text-muted-foreground">
          Historial de compras realizadas en la tienda.
        </p>
      </div>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando pedidos…</p>
      ) : query.isError ? (
        <p className="text-sm text-primary">No se pudieron cargar los pedidos.</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no tienes pedidos.{" "}
          <Link href="/tienda" className="underline hover:text-foreground">
            Ir al catálogo
          </Link>
        </p>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="border-border">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      <Link
                        href={`/tienda/pedidos/${order.id}`}
                        className="hover:underline"
                      >
                        Pedido #{order.id.slice(0, 8)}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <p className="text-lg font-semibold">{formatMoney(order.total)}</p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={orderStatusVariant(order.status)}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  <Badge variant={paymentStatusVariant(order.paymentStatus)}>
                    {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                  </Badge>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/tienda/pedidos/${order.id}`}>Ver detalle</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
