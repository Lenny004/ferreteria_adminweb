"use client";

import { PageHeader } from "@/components/layout/page-header";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api";
import type { CreateSupplierInput, SupplierRow } from "@/lib/api/suppliers";
import { useSuppliers } from "@/hooks/use-suppliers";

const emptyForm = {
  name: "",
  tradeName: "",
  nit: "",
  nrc: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
  municipality: "",
  department: "",
  country: "SV",
  creditDays: "0",
  notes: "",
  isActive: true,
};

type SupplierFilters = {
  q: string;
  includeInactive: boolean;
  country: string;
  withCredit: boolean;
};

const emptyFilters: SupplierFilters = {
  q: "",
  includeInactive: false,
  country: "",
  withCredit: false,
};

export default function ProveedoresContent() {
  const [draft, setDraft] = useState<SupplierFilters>(emptyFilters);
  const [filters, setFilters] = useState<SupplierFilters>(emptyFilters);
  const [page, setPage] = useState(0);
  const { items, total, pageSize, loading, isError, refresh, createSupplier, updateSupplier, submitting } =
    useSuppliers(
      {
        q: filters.q,
        activeOnly: filters.includeInactive ? false : true,
        country: filters.country || undefined,
        withCredit: filters.withCredit || undefined,
      },
      page,
    );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [toggleTarget, setToggleTarget] = useState<SupplierRow | null>(null);
  const [toggling, setToggling] = useState(false);

  function applyFilters() {
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
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(row: SupplierRow) {
    setEditing(row);
    setForm({
      name: row.name,
      tradeName: row.tradeName ?? "",
      nit: row.nit ?? "",
      nrc: row.nrc ?? "",
      contactName: row.contactName ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      address: row.address ?? "",
      municipality: row.municipality ?? "",
      department: row.department ?? "",
      country: row.country || "SV",
      creditDays: String(row.creditDays ?? 0),
      notes: row.notes ?? "",
      isActive: row.isActive,
    });
    setOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload: CreateSupplierInput = {
      name: form.name.trim(),
      tradeName: form.tradeName.trim() || null,
      nit: form.nit.trim() || null,
      nrc: form.nrc.trim() || null,
      contactName: form.contactName.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      municipality: form.municipality.trim() || null,
      department: form.department.trim() || null,
      country: form.country.trim() || "SV",
      creditDays: Number(form.creditDays) || 0,
      notes: form.notes.trim() || null,
    };
    try {
      if (editing) {
        await updateSupplier({ id: editing.id, data: { ...payload, isActive: form.isActive } });
        toast.success("Proveedor actualizado");
      } else {
        await createSupplier(payload);
        toast.success("Proveedor creado");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar");
    }
  }

  async function onConfirmToggle() {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      await updateSupplier({
        id: toggleTarget.id,
        data: { isActive: !toggleTarget.isActive },
      });
      toast.success(toggleTarget.isActive ? "Proveedor desactivado" : "Proveedor activado");
      setToggleTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar el estado");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Proveedores"
        description="Maestro de compras (`purchasing.Suppliers`). País SV = nacional."
        actions={<Button onClick={openCreate}>Nuevo proveedor</Button>}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Nombre, NIT, NRC, país, crédito y vigencia</CardDescription>
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
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                value={draft.q}
                onChange={(e) => setDraft((f) => ({ ...f, q: e.target.value }))}
                placeholder="Ej. Distribuidora"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">País</span>
              <select
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
                value={draft.country}
                onChange={(e) => setDraft((f) => ({ ...f, country: e.target.value }))}
              >
                <option value="">Todos</option>
                <option value="SV">El Salvador (SV)</option>
                <option value="GT">Guatemala (GT)</option>
                <option value="HN">Honduras (HN)</option>
                <option value="NI">Nicaragua (NI)</option>
                <option value="CR">Costa Rica (CR)</option>
                <option value="PA">Panamá (PA)</option>
                <option value="MX">México (MX)</option>
                <option value="US">Estados Unidos (US)</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <input
                type="checkbox"
                checked={draft.withCredit}
                onChange={(e) => setDraft((f) => ({ ...f, withCredit: e.target.checked }))}
              />
              Solo con crédito (&gt; 0 días)
            </label>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <input
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
        <CardContent className="data-table-wrap">
          {isError ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-muted-foreground">No se pudo cargar el listado.</span>
              <Button type="button" size="sm" variant="outline" onClick={() => refresh()}>
                Reintentar
              </Button>
            </div>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin proveedores.</p>
          ) : (
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>NIT</th>
                  <th>País</th>
                  <th>Estado</th>
                  <th>Contacto</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="font-medium">{row.name}</div>
                      {row.tradeName ? (
                        <div className="text-xs text-muted-foreground">{row.tradeName}</div>
                      ) : null}
                    </td>
                    <td>{row.nit ?? "—"}</td>
                    <td>{row.country}</td>
                    <td>
                      <Badge variant={row.isActive ? "success" : "muted"}>
                        {row.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td>
                      {row.contactName || row.phone || "—"}
                    </td>
                    <td className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setToggleTarget(row)}
                        >
                          {row.isActive ? "Desactivar" : "Activar"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar proveedor" : "Nuevo proveedor"}
        description="Datos fiscales y de contacto"
        size="lg"
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
            <span>Nombre comercial</span>
            <input
              className="h-10 rounded-md border border-border px-3"
              value={form.tradeName}
              onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
            />
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
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span>País</span>
              <input
                className="h-10 rounded-md border border-border px-3"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Días crédito</span>
              <input
                type="number"
                min={0}
                className="h-10 rounded-md border border-border px-3"
                value={form.creditDays}
                onChange={(e) => setForm({ ...form, creditDays: e.target.value })}
              />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span>Contacto</span>
            <input
              className="h-10 rounded-md border border-border px-3"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span>Teléfono</span>
              <input
                className="h-10 rounded-md border border-border px-3"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Email</span>
              <input
                type="email"
                className="h-10 rounded-md border border-border px-3"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span>Dirección</span>
            <input
              className="h-10 rounded-md border border-border px-3"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
          {editing ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Activo
            </label>
          ) : null}
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={toggleTarget != null}
        onOpenChange={(o) => {
          if (!o) setToggleTarget(null);
        }}
        title={toggleTarget?.isActive ? "Desactivar proveedor" : "Activar proveedor"}
        description={
          toggleTarget
            ? `${toggleTarget.isActive ? "Desactivar" : "Activar"} a ${toggleTarget.name}.`
            : undefined
        }
        size="md"
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setToggleTarget(null)}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirmToggle} disabled={toggling}>
            {toggling ? "Guardando…" : "Confirmar"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
