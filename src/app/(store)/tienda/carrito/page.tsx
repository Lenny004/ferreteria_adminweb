"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Package, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { cartApi, type CartItem } from "@/lib/api/cart";
import { getShopAccessToken } from "@/lib/api/shop-auth";
import { formatMoney } from "@/lib/utils";

function lineSubtotal(item: CartItem) {
  return Number(item.product.salePrice) * Number(item.quantity);
}

export default function CarritoPage() {
  const qc = useQueryClient();
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

  const cartQuery = useQuery({
    queryKey: ["shop-cart"],
    queryFn: () => cartApi.getCart(),
    enabled: loggedIn,
    retry: false,
  });

  const upsertMut = useMutation({
    mutationFn: (data: { productId: string; quantity: number }) => cartApi.upsertItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shop-cart"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar la cantidad"),
  });

  const removeMut = useMutation({
    mutationFn: (productId: string) => cartApi.removeItem(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shop-cart"] });
      toast.success("Producto quitado del carrito");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "No se pudo quitar el producto"),
  });

  const clearMut = useMutation({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shop-cart"] });
      toast.success("Carrito vaciado");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "No se pudo vaciar el carrito"),
  });

  const busy = upsertMut.isPending || removeMut.isPending || clearMut.isPending;

  function changeQty(item: CartItem, delta: number) {
    const current = Number(item.quantity);
    const max = Number(item.product.currentStock);
    const next = current + delta;

    if (next <= 0) {
      removeMut.mutate(item.productId);
      return;
    }
    if (next > max) {
      toast.error("No hay suficiente stock disponible");
      return;
    }
    upsertMut.mutate({ productId: item.productId, quantity: next });
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!loggedIn) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Carrito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Inicia sesión para ver y gestionar tu carrito de compras.</p>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Carrito</h1>
        <p className="text-sm text-muted-foreground">
          Revisa tus productos antes de confirmar el pedido.
        </p>
      </div>

      {cartQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando carrito…</p>
      ) : cartQuery.isError ? (
        <p className="text-sm text-primary">No se pudo cargar el carrito.</p>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ShoppingCart className="h-8 w-8" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <p className="text-lg font-medium">Tu carrito está vacío</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Explora el catálogo y agrega productos para comenzar tu pedido.
              </p>
            </div>
            <Button asChild>
              <Link href="/tienda">Ir al catálogo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="border-border">
                <CardContent className="flex gap-4 p-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Package className="h-8 w-8" aria-hidden="true" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <Link
                        href={`/tienda/producto/${item.product.id}`}
                        className="line-clamp-2 font-medium hover:underline"
                      >
                        {item.product.description}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.product.code}</p>
                      <p className="text-sm font-semibold">
                        {formatMoney(item.product.salePrice)}
                        {item.product.measurementType?.unitLabel ? (
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            / {item.product.measurementType.unitLabel}
                          </span>
                        ) : null}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
                      <div className="flex items-center gap-1 rounded-lg border border-border">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          disabled={busy}
                          aria-label="Disminuir cantidad"
                          onClick={() => changeQty(item, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="min-w-8 text-center text-sm font-medium">
                          {Number(item.quantity)}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          disabled={busy}
                          aria-label="Aumentar cantidad"
                          onClick={() => changeQty(item, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm font-semibold">{formatMoney(lineSubtotal(item))}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-primary"
                        disabled={busy}
                        onClick={() => removeMut.mutate(item.productId)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Quitar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="h-fit border-border lg:sticky lg:top-24">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({items.length} ítems)</span>
                <span className="font-medium">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="grid gap-2 pt-1">
                <Button asChild disabled={busy}>
                  <Link href="/tienda/checkout">Ir a checkout</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => clearMut.mutate()}
                >
                  Vaciar carrito
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/tienda">Seguir comprando</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
