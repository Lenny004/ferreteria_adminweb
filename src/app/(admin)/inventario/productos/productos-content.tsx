"use client";

/**
 * Catálogo de productos: búsqueda, alta, edición y acceso al kardex.
 * ADMIN y OWNER editan; el resto de roles con acceso solo consulta (la API aplica la misma regla).
 * El stock no se edita aquí: cambia únicamente con movimientos de inventario.
 */

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal, ModalFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Pagination } from "@/components/ui/pagination";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/contexts/session-context";
import {
  PRODUCTS_PAGE_SIZE,
  useCreateProduct,
  useProductCatalog,
  useProductFormOptions,
  useUpdateProduct,
} from "@/hooks/use-products";
import { ApiError } from "@/lib/api";
import type { ProductRow } from "@/lib/api/products";
import { ProductConstraints } from "@/lib/constraints";
import {
  buildProductPayload,
  canManageProducts,
  emptyProductForm,
  productToForm,
  type ProductFormErrors,
  type ProductFormValues,
} from "@/lib/products";
import { formatMoney, formatNumber } from "@/lib/utils";

type CatalogFilters = { q: string; familyId: string; includeInactive: boolean };

const emptyFilters: CatalogFilters = { q: "", familyId: "", includeInactive: false };

/** Indica si el stock está en o por debajo del mínimo (misma regla que las alertas de la API). */
function isAtOrBelowMinimum(product: ProductRow): boolean {
  return Number(product.currentStock) <= Number(product.minStock);
}

/** Pantalla del catálogo de productos con formulario modal de alta/edición. */
export default function ProductosContent() {
  const { user } = useSession();
  const canManage = user ? canManageProducts(user.role) : false;

  const [draft, setDraft] = useState<CatalogFilters>(emptyFilters);
  const [filters, setFilters] = useState<CatalogFilters>(emptyFilters);
  const [page, setPage] = useState(0);
  const catalogQuery = useProductCatalog(filters, page);
  const optionsQuery = useProductFormOptions();
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [pendingDeactivation, setPendingDeactivation] = useState<ReturnType<typeof buildProductPayload> | null>(null);
  const [deactivationError, setDeactivationError] = useState<string | null>(null);

  const families = useMemo(() => optionsQuery.data?.families ?? [], [optionsQuery.data?.families]);
  const measurementTypes = optionsQuery.data?.measurementTypes ?? [];
  const subfamilies = useMemo(
    () => families.find((family) => family.id === form.familyId)?.subfamilies ?? [],
    [families, form.familyId],
  );
  const items = catalogQuery.data?.items ?? [];
  const total = catalogQuery.data?.total ?? 0;
  const submitting = createMut.isPending || updateMut.isPending;

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setPage(0);
    setFilters({ ...draft, q: draft.q.trim() });
  }

  function clearFilters() {
    setDraft(emptyFilters);
    setFilters(emptyFilters);
    setPage(0);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyProductForm);
    setErrors({});
    setOpen(true);
  }

  function openEdit(product: ProductRow) {
    setEditing(product);
    setForm(productToForm(product));
    setErrors({});
    setOpen(true);
  }

  /** Persiste el formulario ya validado; separa alta y edición para mensajes claros. */
  async function save(result: Extract<ReturnType<typeof buildProductPayload>, { ok: true }>) {
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, data: { ...result.data, isActive: form.isActive } });
      toast.success("Producto actualizado");
    } else {
      await createMut.mutateAsync(result.data);
      toast.success("Producto creado. Registra una entrada en Inventario para darle stock.");
    }
    setOpen(false);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = buildProductPayload(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    // Desactivar oculta el producto de selectores y tienda: se confirma aparte.
    if (editing?.isActive && !form.isActive) {
      setDeactivationError(null);
      setPendingDeactivation(result);
      return;
    }
    try {
      await save(result);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el producto");
    }
  }

  async function confirmDeactivation() {
    if (!pendingDeactivation?.ok) return;
    try {
      await save(pendingDeactivation);
      setPendingDeactivation(null);
    } catch (err) {
      setDeactivationError(err instanceof ApiError ? err.message : "No se pudo desactivar el producto");
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Productos"
        description="Catálogo de productos con precio, costo promedio y stock. El stock cambia solo con movimientos de inventario."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/inventario">Movimientos y stock</Link>
            </Button>
            {canManage ? <Button onClick={openCreate}>Nuevo producto</Button> : null}
          </>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Código, descripción o código de barras; familia y vigencia</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={applyFilters}>
            <FormField label="Búsqueda" id="product-search" placeholder="Ej. martillo">
              <Input
                id="product-search"
                maxLength={100}
                value={draft.q}
                onChange={(e) => setDraft((f) => ({ ...f, q: e.target.value }))}
              />
            </FormField>
            <FormField label="Familia" id="product-filter-family">
              <Select
                id="product-filter-family"
                value={draft.familyId}
                onChange={(e) => setDraft((f) => ({ ...f, familyId: e.target.value }))}
              >
                <option value="">Todas</option>
                {families.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <Input
                type="checkbox"
                checked={draft.includeInactive}
                onChange={(e) => setDraft((f) => ({ ...f, includeInactive: e.target.checked }))}
              />
              Incluir inactivos
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="submit" variant="outline">
                Aplicar
              </Button>
              <Button type="button" variant="ghost" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listado ({total})</CardTitle>
        </CardHeader>
        <CardContent className="table-container">
          {catalogQuery.isError ? (
            <QueryErrorState error={catalogQuery.error} onRetry={() => void catalogQuery.refetch()} />
          ) : catalogQuery.isLoading ? (
            <LoadingState label="Cargando productos…" />
          ) : items.length === 0 ? (
            <EmptyState
              title="Sin productos"
              description="No hay productos que coincidan con los filtros."
              action={canManage ? <Button onClick={openCreate}>Nuevo producto</Button> : undefined}
            />
          ) : (
            <table className="data-table min-w-[880px]">
              <thead className="data-table__head">
                <tr className="data-table__row">
                  <th className="data-table__cell data-table__cell--heading">Producto</th>
                  <th className="data-table__cell data-table__cell--heading">Familia</th>
                  <th className="data-table__cell data-table__cell--heading">Unidad</th>
                  <th className="data-table__cell data-table__cell--heading">Precio</th>
                  <th className="data-table__cell data-table__cell--heading">Costo prom.</th>
                  <th className="data-table__cell data-table__cell--heading">Stock</th>
                  <th className="data-table__cell data-table__cell--heading">Estado</th>
                  <th className="data-table__cell data-table__cell--heading" />
                </tr>
              </thead>
              <tbody className="data-table__body">
                {items.map((product) => (
                  <tr key={product.id} className="data-table__row">
                    <td className="data-table__cell">
                      <div className="font-medium">{product.code}</div>
                      <div className="text-xs text-muted-foreground">{product.description}</div>
                    </td>
                    <td className="data-table__cell">{product.family?.name ?? "—"}</td>
                    <td className="data-table__cell">{product.measurementType?.name ?? "—"}</td>
                    <td className="data-table__cell">{formatMoney(product.salePrice)}</td>
                    <td className="data-table__cell">{formatMoney(product.costPrice)}</td>
                    <td className="data-table__cell">
                      <div>{formatNumber(product.currentStock, 3)}</div>
                      {isAtOrBelowMinimum(product) ? (
                        <Badge variant="warning">Mín. {formatNumber(product.minStock, 3)}</Badge>
                      ) : null}
                    </td>
                    <td className="data-table__cell">
                      <Badge variant={product.isActive ? "success" : "muted"}>
                        {product.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="text-right data-table__cell">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/inventario/productos/${product.id}/kardex`}>Kardex</Link>
                        </Button>
                        {canManage ? (
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(product)}>
                            Editar
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination page={page} pageSize={PRODUCTS_PAGE_SIZE} total={total} onPageChange={setPage} />
        </CardContent>
      </Card>

      {canManage ? (
        <Modal
          open={open}
          onOpenChange={setOpen}
          title={editing ? "Editar producto" : "Nuevo producto"}
          description={
            editing
              ? "El stock no se edita aquí; usa los movimientos de inventario."
              : "El producto se crea con stock 0; registra luego una entrada de inventario."
          }
          size="lg"
          footer={
            <ModalFooter
              cancel={
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
              }
              action={
                <Button type="submit" form="product-form" loading={submitting} loadingText="Guardando…">
                  Guardar
                </Button>
              }
            />
          }
        >
          {optionsQuery.isError ? (
            <QueryErrorState compact error={optionsQuery.error} onRetry={() => void optionsQuery.refetch()} />
          ) : null}
          <form id="product-form" className="grid gap-3" noValidate onSubmit={onSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Código" required id="product-code" placeholder="Ej. HER-0001" error={errors.code} constraints={ProductConstraints.code}>
                <Input id="product-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </FormField>
              <FormField label="Código de barras" id="product-barcode" placeholder="7401234567890" error={errors.barcode} constraints={ProductConstraints.barcode}>
                <Input id="product-barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Descripción" required id="product-description" placeholder="Ej. Martillo de uña 16 oz" error={errors.description} constraints={ProductConstraints.description}>
              <Input id="product-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Familia" required id="product-family" error={errors.familyId}>
                <Select
                  id="product-family"
                  value={form.familyId}
                  // Cambiar de familia invalida la subfamilia elegida.
                  onChange={(e) => setForm({ ...form, familyId: e.target.value, subfamilyId: "" })}
                >
                  <option value="">— Seleccionar —</option>
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Subfamilia" id="product-subfamily" error={errors.subfamilyId}>
                <Select
                  id="product-subfamily"
                  value={form.subfamilyId}
                  disabled={subfamilies.length === 0}
                  onChange={(e) => setForm({ ...form, subfamilyId: e.target.value })}
                >
                  <option value="">Sin subfamilia</option>
                  {subfamilies.map((subfamily) => (
                    <option key={subfamily.id} value={subfamily.id}>
                      {subfamily.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <FormField label="Unidad de medida" required id="product-measurement" error={errors.measurementTypeId}>
              <Select
                id="product-measurement"
                value={form.measurementTypeId}
                onChange={(e) => setForm({ ...form, measurementTypeId: e.target.value })}
              >
                <option value="">— Seleccionar —</option>
                {measurementTypes.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.unitLabel})
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="Precio de venta" id="product-sale-price" placeholder="0,00" error={errors.salePrice} constraints={ProductConstraints.salePrice}>
                <Input id="product-sale-price" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
              </FormField>
              <FormField
                label="Costo promedio"
                id="product-cost-price"
                placeholder="0,0000"
                help={editing ? "Se recalcula con cada entrada con costo." : undefined}
                error={errors.costPrice}
                constraints={ProductConstraints.costPrice}
              >
                <Input id="product-cost-price" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
              </FormField>
              <FormField label="Stock mínimo" id="product-min-stock" placeholder="0" error={errors.minStock} constraints={ProductConstraints.minStock}>
                <Input id="product-min-stock" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Notas" id="product-notes" placeholder="Observaciones internas" error={errors.notes}>
              <Textarea id="product-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </FormField>
            {editing ? (
              <label className="flex items-center gap-2 text-sm">
                <Input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Activo
              </label>
            ) : null}
          </form>
        </Modal>
      ) : null}

      <ConfirmDialog
        open={pendingDeactivation != null}
        title="Desactivar producto"
        description={
          editing
            ? `¿Desactivar ${editing.code} — ${editing.description}? Dejará de aparecer en selectores, compras y tienda; su kardex se conserva.`
            : "Confirma la desactivación del producto."
        }
        confirmLabel="Desactivar"
        destructive
        loading={updateMut.isPending}
        error={deactivationError}
        onConfirm={() => void confirmDeactivation()}
        onCancel={() => {
          if (!updateMut.isPending) {
            setPendingDeactivation(null);
            setDeactivationError(null);
          }
        }}
      />
    </div>
  );
}
