"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import {
  publicCatalogApi,
  type PublicCatalogListParams,
} from "@/lib/api/public-catalog";
import { formatMoney } from "@/lib/utils";

const PAGE_SIZE = 24;

type Filters = {
  q: string;
  familyId: string;
  subfamilyId: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  sort: NonNullable<PublicCatalogListParams["sort"]>;
};

const emptyFilters: Filters = {
  q: "",
  familyId: "",
  subfamilyId: "",
  minPrice: "",
  maxPrice: "",
  inStock: false,
  sort: "name_asc",
};

export default function TiendaCatalogoPage() {
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(0);

  const familiesQuery = useQuery({
    queryKey: ["public-families"],
    queryFn: () => publicCatalogApi.listFamilies(),
  });

  const subfamiliesQuery = useQuery({
    queryKey: ["public-subfamilies", draft.familyId],
    queryFn: () => publicCatalogApi.listSubfamilies(draft.familyId || undefined),
    enabled: Boolean(draft.familyId),
  });

  const productsQuery = useQuery({
    queryKey: ["public-products", filters, page],
    queryFn: () =>
      publicCatalogApi.listProducts({
        q: filters.q || undefined,
        familyId: filters.familyId || undefined,
        subfamilyId: filters.subfamilyId || undefined,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        inStock: filters.inStock || undefined,
        sort: filters.sort,
        take: PAGE_SIZE,
        skip: page * PAGE_SIZE,
      }),
  });

  useEffect(() => {
    setPage(0);
  }, [filters]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setFilters({ ...draft });
  }

  const items = productsQuery.data?.items ?? [];
  const total = productsQuery.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Catálogo</h1>
        <p className="text-sm text-muted-foreground">
          Explora productos disponibles en Ferreteria.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Buscar y filtrar</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" onSubmit={onSearch}>
            <label className="grid gap-1 text-sm md:col-span-2 lg:col-span-1">
              <span className="text-muted-foreground">Búsqueda</span>
              <input
                className="h-10 rounded-md border border-border bg-card px-3"
                placeholder="Código o descripción"
                value={draft.q}
                onChange={(e) => setDraft({ ...draft, q: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Familia</span>
              <select
                className="h-10 rounded-md border border-border bg-card px-3"
                value={draft.familyId}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    familyId: e.target.value,
                    subfamilyId: "",
                  })
                }
              >
                <option value="">Todas</option>
                {(familiesQuery.data ?? []).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Subfamilia</span>
              <select
                className="h-10 rounded-md border border-border bg-card px-3"
                value={draft.subfamilyId}
                onChange={(e) => setDraft({ ...draft, subfamilyId: e.target.value })}
                disabled={!draft.familyId}
              >
                <option value="">Todas</option>
                {(subfamiliesQuery.data ?? [])
                  .filter((s) => !draft.familyId || s.familyId === draft.familyId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Precio mínimo</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="h-10 rounded-md border border-border bg-card px-3"
                value={draft.minPrice}
                onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Precio máximo</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="h-10 rounded-md border border-border bg-card px-3"
                value={draft.maxPrice}
                onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Orden</span>
              <select
                className="h-10 rounded-md border border-border bg-card px-3"
                value={draft.sort}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    sort: e.target.value as Filters["sort"],
                  })
                }
              >
                <option value="name_asc">Nombre A–Z</option>
                <option value="name_desc">Nombre Z–A</option>
                <option value="price_asc">Precio menor</option>
                <option value="price_desc">Precio mayor</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm md:col-span-2 lg:col-span-1">
              <input
                type="checkbox"
                checked={draft.inStock}
                onChange={(e) => setDraft({ ...draft, inStock: e.target.checked })}
              />
              <span>Solo con stock</span>
            </label>
            <div className="flex items-end gap-2 md:col-span-2 lg:col-span-3">
              <Button type="submit">Aplicar</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraft(emptyFilters);
                  setFilters(emptyFilters);
                }}
              >
                Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {productsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando productos…</p>
      ) : productsQuery.isError ? (
        <p className="text-sm text-primary">No se pudo cargar el catálogo.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay productos con esos filtros.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <Link key={product.id} href={`/tienda/producto/${product.id}`}>
                <Card className="h-full border-border transition hover:border-foreground/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-2 text-base">
                      {product.description}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Código: {product.code}</p>
                    {product.family ? (
                      <p className="text-muted-foreground">{product.family.name}</p>
                    ) : null}
                    <p className="text-lg font-semibold">{formatMoney(product.salePrice)}</p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {Number(product.currentStock) > 0 ? "Disponible" : "Agotado"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
