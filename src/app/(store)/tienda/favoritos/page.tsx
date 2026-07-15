"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { favoritesApi } from "@/lib/api/favorites";
import { getShopAccessToken } from "@/lib/api/shop-auth";
import { formatMoney } from "@/lib/utils";

export default function FavoritosPage() {
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

  const query = useQuery({
    queryKey: ["shop-favorites"],
    queryFn: () => favoritesApi.list(),
    enabled: loggedIn,
    retry: false,
  });

  const removeMut = useMutation({
    mutationFn: (productId: string) => favoritesApi.remove(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shop-favorites"] });
      toast.success("Quitado de favoritos");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "No se pudo quitar"),
  });

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!loggedIn) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Favoritos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Inicia sesión para ver y gestionar tus productos favoritos.</p>
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

  const items = query.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Favoritos</h1>
        <p className="text-sm text-muted-foreground">
          Productos que marcaste para consultar después.
        </p>
      </div>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando favoritos…</p>
      ) : query.isError ? (
        <p className="text-sm text-primary">No se pudieron cargar los favoritos.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no tienes favoritos.{" "}
          <Link href="/tienda" className="underline hover:text-foreground">
            Ir al catálogo
          </Link>
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((fav) => (
            <Card key={fav.id} className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-2 text-base">
                  <Link
                    href={`/tienda/producto/${fav.product.id}`}
                    className="hover:underline"
                  >
                    {fav.product.description}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{fav.product.code}</p>
                <p className="font-semibold">{formatMoney(fav.product.salePrice)}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={removeMut.isPending}
                  onClick={() => removeMut.mutate(fav.productId)}
                >
                  Quitar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
