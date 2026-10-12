"use client";

/**
 * Catálogo ecommerce — layout sidenav + grid ProductCard.
 *
 * Props esperadas (componentes creados en paralelo):
 *
 * StoreSideNav (@/components/store/store-sidenav):
 *   departments: PublicCatalogDepartment[]
 *   selectedFamilyId?: string
 *   selectedSubfamilyId?: string
 *   onSelectFamily: (familyId: string) => void
 *   onSelectSubfamily: (familyId: string, subfamilyId: string) => void
 *   onClear?: () => void
 *   isLoading?: boolean
 *
 * ProductCard (@/components/store/product-card):
 *   product: PublicProduct
 *   onAddToCart?: () => void
 *   isAddingToCart?: boolean
 *   addDisabled?: boolean
 *
 * cartApi (@/lib/api/cart):
 *   upsertItem: (payload: { productId: string; quantity: number }) => Promise<unknown>
 */

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProductCard } from "@/components/store/product-card";
import { StoreSideNav } from "@/components/store/store-sidenav";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { cartApi } from "@/lib/api/cart";
import {
  publicCatalogApi,
  type PublicCatalogListParams,
  type PublicFamily,
  type PublicProduct,
  type PublicSubfamily,
} from "@/lib/api/public-catalog";
import { useShopSession } from "@/hooks/use-shop-session";
import { ProductConstraints } from "@/lib/constraints";

const PAGE_SIZE = 24;

/** Departamento con subfamilias anidadas (listDepartments o familias enriquecidas). */
export type PublicCatalogDepartment = PublicFamily & {
  subfamilies?: PublicSubfamily[];
};

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

function filtersFromSearchParams(params: URLSearchParams): Filters {
  const sort = params.get("sort");
  const validSort: Filters["sort"] =
    sort === "name_desc" ||
    sort === "price_asc" ||
    sort === "price_desc" ||
    sort === "name_asc"
      ? sort
      : "name_asc";

  return {
    q: params.get("q") ?? "",
    familyId: params.get("familyId") ?? "",
    subfamilyId: params.get("subfamilyId") ?? "",
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    inStock: params.get("inStock") === "true",
    sort: validSort,
  };
}

function buildCatalogQuery(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.familyId) params.set("familyId", filters.familyId);
  if (filters.subfamilyId) params.set("subfamilyId", filters.subfamilyId);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.inStock) params.set("inStock", "true");
  if (filters.sort && filters.sort !== "name_asc") params.set("sort", filters.sort);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function fetchDepartments(): Promise<PublicCatalogDepartment[]> {
  const [families, subfamilies] = await Promise.all([
    publicCatalogApi.listDepartments().catch(() => publicCatalogApi.listFamilies()),
    publicCatalogApi.listSubfamilies(),
  ]);
  return families.map((family) => ({
    ...family,
    subfamilies: subfamilies.filter((s) => s.familyId === family.id),
  }));
}

/** Contenido interactivo del catálogo público y su acción de carrito. */
function TiendaCatalogoPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const queryClient = useQueryClient();
  const { status } = useShopSession();

  const [draft, setDraft] = useState<Filters>(() =>
    filtersFromSearchParams(new URLSearchParams(searchParamsKey)),
  );
  const [filters, setFilters] = useState<Filters>(() =>
    filtersFromSearchParams(new URLSearchParams(searchParamsKey)),
  );
  const [page, setPage] = useState(0);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  const syncUrl = useCallback(
    (next: Filters) => {
      router.replace(`${pathname}${buildCatalogQuery(next)}`, { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    const fromUrl = filtersFromSearchParams(new URLSearchParams(searchParamsKey));
    setFilters(fromUrl);
    setDraft(fromUrl);
    setPage(0);
  }, [searchParamsKey]);

  const departmentsQuery = useQuery({
    queryKey: ["public-departments"],
    queryFn: fetchDepartments,
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

  const addToCartMutation = useMutation({
    mutationFn: (productId: string) => cartApi.upsertItem({ productId, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-cart"] });
      toast.success("Producto agregado al carrito");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "No se pudo agregar al carrito"),
    onSettled: () => setAddingProductId(null),
  });

  function applyFilters(next: Filters) {
    setFilters(next);
    setDraft(next);
    syncUrl(next);
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    applyFilters({ ...draft });
  }

  function onSelectFamily(familyId: string | null) {
    const next = {
      ...filters,
      familyId: familyId ?? "",
      subfamilyId: "",
    };
    applyFilters(next);
  }

  function onSelectSubfamily(subfamilyId: string | null) {
    const next = {
      ...filters,
      subfamilyId: subfamilyId ?? "",
    };
    applyFilters(next);
  }

  function handleAddToCart(product: PublicProduct) {
    if (status === "loading") return;
    if (status === "anonymous") {
      router.push("/tienda/login");
      return;
    }
    setAddingProductId(product.id);
    addToCartMutation.mutate(product.id);
  }

  const items = productsQuery.data?.items ?? [];
  const total = productsQuery.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Catálogo</h1>
        <p className="text-sm text-muted-foreground">
          Explora productos por departamento y agrégalos al carrito.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <aside className="w-full shrink-0 lg:w-56 xl:w-64">
          <StoreSideNav
            families={departmentsQuery.data ?? []}
            subfamilies={(departmentsQuery.data ?? []).flatMap((d) =>
              (d.subfamilies ?? []).map((s) => ({ ...s, familyId: s.familyId || d.id })),
            )}
            selectedFamilyId={filters.familyId || null}
            selectedSubfamilyId={filters.subfamilyId || null}
            onSelectFamily={onSelectFamily}
            onSelectSubfamily={onSelectSubfamily}
          />
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          <section
            aria-label="Filtros del catálogo"
            className="rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <form
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              onSubmit={onSearch}
            >
              <FormField
                label="Búsqueda"
                id="catalog-search"
                placeholder="Código o descripción"
                className="sm:col-span-2 lg:col-span-2 xl:col-span-2"
              >
                <Input
                  id="catalog-search"
                  value={draft.q}
                  onChange={(e) => setDraft({ ...draft, q: e.target.value })}
                />
              </FormField>
              <FormField
                label="Precio mínimo"
                id="catalog-min-price"
                placeholder="0,00"
                constraints={ProductConstraints.salePrice}
              >
                <Input
                  id="catalog-min-price"
                  type="number"
                  value={draft.minPrice}
                  onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })}
                />
              </FormField>
              <FormField
                label="Precio máximo"
                id="catalog-max-price"
                placeholder="999,99"
                constraints={ProductConstraints.salePrice}
              >
                <Input
                  id="catalog-max-price"
                  type="number"
                  value={draft.maxPrice}
                  onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
                />
              </FormField>
              <FormField label="Orden" id="catalog-sort">
                <Select
                  id="catalog-sort"
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
                </Select>
              </FormField>
              <label className="flex items-center gap-2 self-end text-sm sm:col-span-2 lg:col-span-1">
                <Input
                  type="checkbox"
                  checked={draft.inStock}
                  onChange={(e) => setDraft({ ...draft, inStock: e.target.checked })}
                />
                <span>Solo con stock</span>
              </label>
              <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                <Button type="submit">Aplicar filtros</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    applyFilters(emptyFilters);
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </form>
          </section>

          {productsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando productos…</p>
          ) : productsQuery.isError ? (
            <p className="text-sm text-primary">No se pudo cargar el catálogo.</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay productos con esos filtros.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {total} producto{total === 1 ? "" : "s"}
                {filters.familyId || filters.q ? " encontrados" : ""}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                    isAddingToCart={addingProductId === product.id && addToCartMutation.isPending}
                    addDisabled={Number(product.currentStock) <= 0}
                  />
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
      </div>
    </div>
  );
}

/** Página pública del catálogo de la tienda. */
export default function TiendaCatalogoPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando catálogo…</p>
      </div>
    }>
      <TiendaCatalogoPageContent />
    </Suspense>
  );
}
