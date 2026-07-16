"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api";
import {
  customersApi,
  type CreateCustomerInput,
  type CustomerRow,
} from "@/lib/api/customers";

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
            <label className="grid gap-1 text-sm sm:col-span-2 lg:col-span-1">
              <span className="text-muted-foreground">Búsqueda</span>
              <input
                className="h-10 w-full rounded-md border border-border px-3 text-sm"
                value={draft.q}
                onChange={(e) => setDraft((f) => ({ ...f, q: e.target.value }))}
                placeholder="Nombre, NIT, NRC, DUI"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Tipo</span>
              <select
                className="h-10 w-full rounded-md border border-border px-3 text-sm"
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
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <input
                type="checkbox"
                checked={draft.hasNit}
                onChange={(e) => setDraft((f) => ({ ...f, hasNit: e.target.checked }))}
              />
              Solo con NIT
            </label>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <input
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
        <CardContent className="data-table-wrap">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin clientes.</p>
          ) : (
            <>
              <table className="data-table min-w-[640px]">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>NIT</th>
                    <th>Teléfono</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.customerType}</td>
                      <td>{row.nit ?? "—"}</td>
                      <td>{row.phone ?? "—"}</td>
                      <td className="text-right">
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
      >
        <form className="grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1 text-sm">
            <span>Nombre *</span>
            <input
              required
              className="h-10 rounded-md border border-border px-3"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Tipo</span>
            <select
              className="h-10 rounded-md border border-border px-3"
              value={form.customerType}
              onChange={(e) => setForm({ ...form, customerType: e.target.value })}
            >
              <option value="CF">CF</option>
              <option value="CCF">CCF</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span>NIT</span>
              <input
                className="h-10 rounded-md border border-border px-3"
                value={form.nit}
                onChange={(e) => setForm({ ...form, nit: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>NRC</span>
              <input
                className="h-10 rounded-md border border-border px-3"
                value={form.nrc}
                onChange={(e) => setForm({ ...form, nrc: e.target.value })}
              />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span>Teléfono</span>
            <input
              className="h-10 rounded-md border border-border px-3"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMut.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
