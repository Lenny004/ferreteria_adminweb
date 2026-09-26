"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { cartApi } from "@/lib/api/cart";
import { favoritesApi } from "@/lib/api/favorites";
import { publicCatalogApi, type PublicProduct } from "@/lib/api/public-catalog";
import { getShopAccessToken } from "@/lib/api/shop-auth";
import { formatMoney } from "@/lib/utils";

type ProductDetail = PublicProduct & {
  brand?: string | null;
  shortDescription?: string | null;
  imageUrl?: string | null;
};

export default function ProductoDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const qc = useQueryClient();
  const [loggedIn, setLoggedIn] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    function sync() {
      setLoggedIn(Boolean(getShopAccessToken()));
    }
    sync();
    window.addEventListener("shop-token-changed", sync);
    return () => window.removeEventListener("shop-token-changed", sync);
  }, []);

  const productQuery = useQuery({
    queryKey: ["public-product", id],
    queryFn: () => publicCatalogApi.getProduct(id),
    enabled: Boolean(id),
  });

  const favoritesQuery = useQuery({
    queryKey: ["shop-favorites"],
    queryFn: () => favoritesApi.list(),
    enabled: loggedIn,
    retry: false,
  });

  const isFavorite = (favoritesQuery.data ?? []).some((f) => f.productId === id);

  const toggleMut = useMutation({
    mutationFn: async () => {
      if (isFavorite) return favoritesApi.remove(id);
      return favoritesApi.add(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shop-favorites"] });
      toast.success(isFavorite ? "Quitado de favoritos" : "Añadido a favoritos");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar favoritos"),
  });

  const addToCartMut = useMutation({
    mutationFn: ({ qty, gotoCart }: { qty: number; gotoCart?: boolean }) =>
      cartApi.upsertItem({ productId: id, quantity: qty }).then(() => gotoCart),
    onSuccess: (gotoCart) => {
      qc.invalidateQueries({ queryKey: ["shop-cart"] });
      if (gotoCart) {
        router.push("/tienda/carrito");
      } else {
        toast.success("Producto agregado al carrito");
      }
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "No se pudo agregar al carrito"),
  });

  const product = productQuery.data as ProductDetail | undefined;
  const stock = product ? Number(product.currentStock) : 0;
  const inStock = stock > 0;
  const maxQty = inStock ? Math.min(Math.floor(stock), 99) : 99;

  useEffect(() => {
    setQuantity((prev) => Math.min(Math.max(1, prev), maxQty));
  }, [maxQty]);

  function loginNextUrl() {
    return `/tienda/login?next=${encodeURIComponent(`/tienda/producto/${id}`)}`;
  }

  function requireLogin(): boolean {
    if (loggedIn) return true;
    router.push(loginNextUrl());
    return false;
  }

  function handleAddToCart() {
    if (!inStock || !requireLogin()) return;
    addToCartMut.mutate({ qty: quantity });
  }

  function handleBuyNow() {
    if (!inStock || !requireLogin()) return;
    addToCartMut.mutate({ qty: quantity, gotoCart: true });
  }

  if (productQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando producto…</p>;
  }

  if (productQuery.isError || !product) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-primary">Producto no encontrado.</p>
        <Button asChild variant="outline">
          <Link href="/tienda">Volver al catálogo</Link>
        </Button>
      </div>
    );
  }

  const unitLabel =
    product.measurementType?.unitLabel ?? product.measurementType?.name ?? "—";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/tienda">← Catálogo</Link>
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.description}
              className="aspect-square w-full object-contain"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-muted/50 text-muted-foreground">
              <span className="text-sm">Sin imagen</span>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            {product.brand ? (
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {product.brand}
              </p>
            ) : null}
            <h1 className="text-2xl font-semibold leading-tight">{product.description}</h1>
            {product.shortDescription ? (
              <p className="text-sm text-muted-foreground">{product.shortDescription}</p>
            ) : null}
          </div>

          <p className="text-3xl font-semibold">{formatMoney(product.salePrice)}</p>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Código</dt>
              <dd className="font-medium">{product.code}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Unidad</dt>
              <dd className="font-medium">{unitLabel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Familia</dt>
              <dd className="font-medium">{product.family?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Subfamilia</dt>
              <dd className="font-medium">{product.subfamily?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Stock</dt>
              <dd className="font-medium">
                {inStock ? (
                  <span>{Math.floor(stock)} disponible{Math.floor(stock) !== 1 ? "s" : ""}</span>
                ) : (
                  <span className="text-primary">Agotado</span>
                )}
              </dd>
            </div>
          </dl>

          {inStock ? (
            <Card className="border-border">
              <CardContent className="space-y-4 pt-6">
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">Cantidad</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 shrink-0 px-0"
                      disabled={quantity <= 1 || addToCartMut.isPending}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Disminuir cantidad"
                    >
                      −
                    </Button>
                    <input
                      type="number"
                      min={1}
                      max={maxQty}
                      value={quantity}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        if (Number.isNaN(next)) return;
                        setQuantity(Math.min(Math.max(1, next), maxQty));
                      }}
                      className="h-10 w-20 rounded-md border border-border bg-card px-3 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 shrink-0 px-0"
                      disabled={quantity >= maxQty || addToCartMut.isPending}
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </Button>
                  </div>
                </label>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={addToCartMut.isPending}
                    onClick={handleAddToCart}
                  >
                    Agregar al carrito
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={addToCartMut.isPending}
                    onClick={handleBuyNow}
                  >
                    Comprar ahora
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">Este producto no está disponible por ahora.</p>
          )}

          <div className="border-t border-border pt-4">
            {loggedIn ? (
              <Button
                type="button"
                variant={isFavorite ? "outline" : "default"}
                disabled={toggleMut.isPending || favoritesQuery.isLoading}
                onClick={() => toggleMut.mutate()}
              >
                {isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link href={loginNextUrl()} className="underline hover:text-foreground">
                  Inicia sesión
                </Link>{" "}
                para guardar este producto en favoritos.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
