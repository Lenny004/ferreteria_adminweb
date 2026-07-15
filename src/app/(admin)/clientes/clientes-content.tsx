"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

export default function ClientesContent() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ["customers", search, page],
    queryFn: () =>
      customersApi.list({
        q: search || undefined,
        take: PAGE_SIZE,
        skip: page * PAGE_SIZE,
      }),
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [form, setForm] = useState(empty);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Maestro fiscal CF/CCF para facturación.
          </p>
        </div>
        <Button onClick={openCreate}>Nuevo cliente</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Buscar</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <input
            className="h-10 flex-1 rounded-md border border-border px-3 text-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre, NIT, NRC, DUI"
          />
          <Button
            variant="outline"
            onClick={() => {
              setPage(0);
              setSearch(q.trim());
            }}
          >
            Buscar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listado ({total})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin clientes.</p>
          ) : (
            <>
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Nombre</th>
                    <th className="pb-2 pr-3 font-medium">Tipo</th>
                    <th className="pb-2 pr-3 font-medium">NIT</th>
                    <th className="pb-2 pr-3 font-medium">Teléfono</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-2 pr-3">{row.name}</td>
                      <td className="py-2 pr-3">{row.customerType}</td>
                      <td className="py-2 pr-3">{row.nit ?? "—"}</td>
                      <td className="py-2 pr-3">{row.phone ?? "—"}</td>
                      <td className="py-2 text-right">
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
