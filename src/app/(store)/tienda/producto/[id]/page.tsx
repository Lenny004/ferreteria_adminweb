"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { favoritesApi } from "@/lib/api/favorites";
import { publicCatalogApi } from "@/lib/api/public-catalog";
import { getShopAccessToken } from "@/lib/api/shop-auth";
import { formatMoney } from "@/lib/utils";

export default function ProductoDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const [loggedIn, setLoggedIn] = useState(false);

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

  if (productQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando producto…</p>;
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-primary">Producto no encontrado.</p>
        <Button asChild variant="outline">
          <Link href="/tienda">Volver al catálogo</Link>
        </Button>
      </div>
    );
  }

  const product = productQuery.data;
  const stock = Number(product.currentStock);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/tienda">← Catálogo</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{product.description}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Código</p>
              <p className="font-medium">{product.code}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Precio</p>
              <p className="text-lg font-semibold">{formatMoney(product.salePrice)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Familia</p>
              <p className="font-medium">{product.family?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Subfamilia</p>
              <p className="font-medium">{product.subfamily?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Unidad</p>
              <p className="font-medium">
                {product.measurementType?.unitLabel ?? product.measurementType?.name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Disponibilidad</p>
              <p className="font-medium">{stock > 0 ? "En stock" : "Agotado"}</p>
            </div>
          </div>

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
            <p className="text-muted-foreground">
              <Link href="/tienda/login" className="underline hover:text-foreground">
                Inicia sesión
              </Link>{" "}
              para guardar este producto en favoritos.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
