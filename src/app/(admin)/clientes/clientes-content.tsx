"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import {
  customersApi,
  type CreateCustomerInput,
  type CustomerRow,
} from "@/lib/api/customers";
import { CustomerConstraints } from "@/lib/constraints";

const PAGE_SIZE = 20;

const empty = {
  name: "",
  customerType: "CF",
  dui: "",
  nit: "",
  nrc: "",
  phone: "",
  email: "",
  address: "",
};

type CustomerFilters = {
  q: string;
  customerType: "" | "CF" | "CCF";
  hasNit: boolean;
  hasNrc: boolean;
};

const emptyFilters: CustomerFilters = {
  q: "",
  customerType: "",
  hasNit: false,
  hasNrc: false,
};

/** Lista y administra los clientes del panel con filtros y paginación. */
export default function ClientesContent() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<CustomerFilters>(emptyFilters);
  const [filters, setFilters] = useState<CustomerFilters>(emptyFilters);
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ["customers", filters, page],
    queryFn: () =>
      customersApi.list({
        q: filters.q || undefined,
        customerType: filters.customerType || undefined,
        hasNit: filters.hasNit || undefined,
        hasNrc: filters.hasNrc || undefined,
        take: PAGE_SIZE,
        skip: page * PAGE_SIZE,
      }),
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [form, setForm] = useState(empty);

  function applyFilters() {
    setPage(0);
    setFilters({ ...draft, q: draft.q.trim() });
  }

  function clearFilters() {
    setDraft(emptyFilters);
    setFilters(emptyFilters);
    setPage(0);
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload: CreateCustomerInput = {
        name: form.name.trim(),
        customerType: form.customerType,
        dui: form.dui.trim() || null,
        nit: form.nit.trim() || null,
        nrc: form.nrc.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
      };
      if (editing) return customersApi.update(editing.id, payload);
      return customersApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      toast.success(editing ? "Cliente actualizado" : "Cliente creado");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar"),
  });

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(row: CustomerRow) {
    setEditing(row);
    setForm({
      name: row.name,
      customerType: row.customerType || "CF",
      dui: row.dui ?? "",
      nit: row.nit ?? "",
      nrc: row.nrc ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      address: row.address ?? "",
    });
    setOpen(true);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    saveMut.mutate();
  }

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  return (
    <div className="page-stack">
      <PageHeader
        title="Clientes"
        description="Maestro fiscal CF/CCF para facturación."
        actions={<Button onClick={openCreate}>Nuevo cliente</Button>}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
          >
            <FormField
              label="Búsqueda"
              id="customer-search"
              placeholder="Nombre, NIT, NRC o DUI"
              constraints={CustomerConstraints.name}
              className="sm:col-span-2 lg:col-span-1"
            >
              <Input
                id="customer-search"
                value={draft.q}
                onChange={(e) => setDraft((f) => ({ ...f, q: e.target.value }))}
              />
            </FormField>
            <FormField label="Tipo" id="customer-filter-type">
              <Select
                id="customer-filter-type"
                value={draft.customerType}
                onChange={(e) =>
                  setDraft((f) => ({
                    ...f,
                    customerType: e.target.value as CustomerFilters["customerType"],
                  }))
                }
              >
                <option value="">Todos</option>
                <option value="CF">CF</option>
                <option value="CCF">CCF</option>
              </Select>
            </FormField>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <Input
                type="checkbox"
                checked={draft.hasNit}
                onChange={(e) => setDraft((f) => ({ ...f, hasNit: e.target.checked }))}
              />
              Solo con NIT
            </label>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <Input
                type="checkbox"
                checked={draft.hasNrc}
                onChange={(e) => setDraft((f) => ({ ...f, hasNrc: e.target.checked }))}
              />
              Solo con NRC
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
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : query.isError ? (
            <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin clientes.</p>
          ) : (
            <>
              <table className="data-table min-w-[640px]">
                <thead className="data-table__head data-table__head">
                  <tr className="data-table__row data-table__row">
                    <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Nombre</th>
                    <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Tipo</th>
                    <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">NIT</th>
                    <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Teléfono</th>
                    <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading" />
                  </tr>
                </thead>
                <tbody className="data-table__body data-table__body">
                  {items.map((row) => (
                    <tr key={row.id} className="data-table__row data-table__row">
                      <td className="data-table__cell data-table__cell">{row.name}</td>
                      <td className="data-table__cell data-table__cell">{row.customerType}</td>
                      <td className="data-table__cell data-table__cell">{row.nit ?? "—"}</td>
                      <td className="data-table__cell data-table__cell">{row.phone ?? "—"}</td>
                      <td className="text-right data-table__cell data-table__cell">
                        <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar cliente" : "Nuevo cliente"}
        description="Datos fiscales básicos"
        size="md"
        footer={
          <ModalFooter
            cancel={<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>}
            action={<Button type="submit" form="customer-form" loading={saveMut.isPending} loadingText="Guardando…">Guardar</Button>}
          />
        }
      >
        <form id="customer-form" className="grid gap-3" onSubmit={onSubmit}>
          <FormField label="Nombre" required id="customer-name" placeholder="Ej. Ferretería Central" constraints={CustomerConstraints.name}>
            <Input
              id="customer-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>
          <FormField label="Tipo" id="customer-type">
            <Select
              id="customer-type"
              value={form.customerType}
              onChange={(e) => setForm({ ...form, customerType: e.target.value })}
            >
              <option value="CF">CF</option>
              <option value="CCF">CCF</option>
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="NIT" id="customer-nit" placeholder="0614-123456-101-2" constraints={CustomerConstraints.nit}>
              <Input
                id="customer-nit"
                value={form.nit}
                onChange={(e) => setForm({ ...form, nit: e.target.value })}
              />
            </FormField>
            <FormField label="NRC" id="customer-nrc" placeholder="123456-7" constraints={CustomerConstraints.nrc}>
              <Input
                id="customer-nrc"
                value={form.nrc}
                onChange={(e) => setForm({ ...form, nrc: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Teléfono" id="customer-phone" placeholder="7000-0000" constraints={CustomerConstraints.phone}>
            <Input
              id="customer-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </FormField>
          <FormField label="Correo" id="customer-email" placeholder="compras@cliente.com" constraints={CustomerConstraints.email}>
            <Input
              id="customer-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </FormField>
          <FormField label="Dirección" id="customer-address" placeholder="Calle y número" constraints={CustomerConstraints.address}>
            <Input
              id="customer-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
