"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { cartApi, type CartItem } from "@/lib/api/cart";
import { getShopAccessToken } from "@/lib/api/shop-auth";
import {
  shopOrdersApi,
  type ShopDeliveryType,
  type ShopPaymentMethod,
} from "@/lib/api/shop-orders";
import { formatMoney } from "@/lib/utils";

const DELIVERY_OPTIONS: { value: ShopDeliveryType; label: string }[] = [
  { value: "RETIRO_TIENDA", label: "Retiro en tienda" },
  { value: "ENVIO", label: "Envío a domicilio" },
];

const PAYMENT_OPTIONS: { value: ShopPaymentMethod; label: string }[] = [
  { value: "EFECTIVO_RETIRO", label: "Efectivo al retirar" },
  { value: "TRANSFERENCIA", label: "Transferencia bancaria" },
  { value: "TARJETA", label: "Tarjeta de crédito/débito" },
  { value: "CONTRA_ENTREGA", label: "Contra entrega" },
];

function lineSubtotal(item: CartItem) {
  return Number(item.product.salePrice) * Number(item.quantity);
}

export default function CheckoutPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  const [deliveryType, setDeliveryType] = useState<ShopDeliveryType>("RETIRO_TIENDA");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<ShopPaymentMethod>("EFECTIVO_RETIRO");
  const [customerNotes, setCustomerNotes] = useState("");

  useEffect(() => {
    function sync() {
      setLoggedIn(Boolean(getShopAccessToken()));
      setReady(true);
    }
    sync();
    window.addEventListener("shop-token-changed", sync);
    return () => window.removeEventListener("shop-token-changed", sync);
  }, []);

  const cartQuery = useQuery({
    queryKey: ["shop-cart"],
    queryFn: () => cartApi.getCart(),
    enabled: loggedIn,
    retry: false,
  });

  const checkoutMut = useMutation({
    mutationFn: async () => {
      const order = await shopOrdersApi.checkout({
        deliveryType,
        shippingAddress:
          deliveryType === "ENVIO" ? shippingAddress.trim() || null : null,
        paymentMethod,
        customerNotes: customerNotes.trim() || null,
      });

      if (paymentMethod === "TARJETA" && order.paymentStatus !== "PAGADO") {
        try {
          return await shopOrdersApi.payOrder(order.id, { method: "TARJETA" });
        } catch {
          return order;
        }
      }

      return order;
    },
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ["shop-cart"] });
      toast.success("Pedido confirmado correctamente");
      router.push(`/tienda/pedidos/${order.id}`);
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "No se pudo confirmar el pedido"),
  });

  function validate(): string | null {
    const items = cartQuery.data?.items ?? [];
    if (items.length === 0) return "Tu carrito está vacío";

    if (deliveryType === "ENVIO") {
      const address = shippingAddress.trim();
      if (address.length < 10) return "Indica una dirección de envío válida (mínimo 10 caracteres)";
      if (address.length > 500) return "La dirección no puede superar 500 caracteres";
    }

    if (!paymentMethod) return "Selecciona un método de pago";

    if (customerNotes.trim().length > 2000) {
      return "Las notas no pueden superar 2000 caracteres";
    }

    return null;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    checkoutMut.mutate();
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!loggedIn) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Inicia sesión para finalizar tu compra.</p>
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

  const items = cartQuery.data?.items ?? [];
  const subtotal = cartQuery.data?.subtotal ?? 0;

  if (cartQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando carrito…</p>;
  }

  if (cartQuery.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-primary">No se pudo cargar el carrito.</p>
        <Button asChild variant="outline">
          <Link href="/tienda/carrito">Volver al carrito</Link>
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>No hay productos en tu carrito para confirmar.</p>
          <Button asChild>
            <Link href="/tienda">Ir al catálogo</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="text-sm text-muted-foreground">
          Completa la entrega y el pago para confirmar tu pedido.
        </p>
      </div>

      <form className="grid gap-6 lg:grid-cols-[1fr_320px]" onSubmit={onSubmit}>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entrega</CardTitle>
              <CardDescription>Elige cómo recibirás tu pedido.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {DELIVERY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="deliveryType"
                    value={opt.value}
                    checked={deliveryType === opt.value}
                    onChange={() => setDeliveryType(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}

              {deliveryType === "ENVIO" ? (
                <label className="grid gap-1 text-sm">
                  <span>Dirección de envío *</span>
                  <textarea
                    required
                    minLength={10}
                    maxLength={500}
                    rows={3}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Calle, número, colonia, municipio, referencias…"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                  />
                </label>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pago</CardTitle>
              <CardDescription>Selecciona cómo deseas pagar.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {PAYMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.value}
                    checked={paymentMethod === opt.value}
                    onChange={() => setPaymentMethod(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notas del pedido</CardTitle>
              <CardDescription>Opcional — instrucciones para la tienda.</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="grid gap-1 text-sm">
                <span>Comentarios</span>
                <textarea
                  maxLength={2000}
                  rows={4}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Horario preferido, detalles de entrega, etc."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                />
              </label>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="h-fit border-border lg:sticky lg:top-24">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Resumen del carrito</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3 text-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Package className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-medium">{item.product.description}</p>
                      <p className="text-muted-foreground">
                        {Number(item.quantity)} × {formatMoney(item.product.salePrice)}
                      </p>
                    </div>
                    <p className="shrink-0 font-medium">{formatMoney(lineSubtotal(item))}</p>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 border-t border-border pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
              </div>

              <div className="grid gap-2">
                <Button type="submit" disabled={checkoutMut.isPending}>
                  {checkoutMut.isPending ? "Confirmando…" : "Confirmar pedido"}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link href="/tienda/carrito">Volver al carrito</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
