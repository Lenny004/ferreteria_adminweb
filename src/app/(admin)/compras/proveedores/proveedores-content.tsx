"use client";

import { PageHeader } from "@/components/layout/page-header";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import type { CreateSupplierInput, SupplierRow } from "@/lib/api/suppliers";
import { useSuppliers } from "@/hooks/use-suppliers";
import { SupplierConstraints } from "@/lib/constraints";

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
  const { items, total, pageSize, loading, isError, error, refresh, createSupplier, updateSupplier, submitting } =
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
            <FormField
              label="Búsqueda"
              id="supplier-search"
              placeholder="Ej. Distribuidora"
              constraints={SupplierConstraints.name}
              className="sm:col-span-2 lg:col-span-1"
            >
              <Input
                id="supplier-search"
                value={draft.q}
                onChange={(e) => setDraft((f) => ({ ...f, q: e.target.value }))}
              />
            </FormField>
            <FormField label="País" id="supplier-filter-country">
              <Select
                id="supplier-filter-country"
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
              </Select>
            </FormField>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <Input
                type="checkbox"
                checked={draft.withCredit}
                onChange={(e) => setDraft((f) => ({ ...f, withCredit: e.target.checked }))}
              />
              Solo con crédito (&gt; 0 días)
            </label>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
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
          {isError ? (
            <QueryErrorState error={error} onRetry={() => void refresh()} />
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin proveedores.</p>
          ) : (
            <table className="data-table min-w-[720px]">
              <thead className="data-table__head data-table__head">
                <tr className="data-table__row data-table__row">
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Nombre</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">NIT</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">País</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Estado</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Contacto</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading" />
                </tr>
              </thead>
              <tbody className="data-table__body data-table__body">
                {items.map((row) => (
                  <tr key={row.id} className="data-table__row data-table__row">
                    <td className="data-table__cell data-table__cell">
                      <div className="font-medium">{row.name}</div>
                      {row.tradeName ? (
                        <div className="text-xs text-muted-foreground">{row.tradeName}</div>
                      ) : null}
                    </td>
                    <td className="data-table__cell data-table__cell">{row.nit ?? "—"}</td>
                    <td className="data-table__cell data-table__cell">{row.country}</td>
                    <td className="data-table__cell data-table__cell">
                      <Badge variant={row.isActive ? "success" : "muted"}>
                        {row.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="data-table__cell data-table__cell">
                      {row.contactName || row.phone || "—"}
                    </td>
                    <td className="text-right data-table__cell data-table__cell">
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
        footer={
          <ModalFooter
            cancel={<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>}
            action={<Button type="submit" form="supplier-form" loading={submitting} loadingText="Guardando…">Guardar</Button>}
          />
        }
      >
        <form id="supplier-form" className="grid gap-3" onSubmit={onSubmit}>
          <FormField label="Nombre" required id="supplier-name" placeholder="Ej. Distribuidora Central" constraints={SupplierConstraints.name}>
            <Input
              id="supplier-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>
          <FormField label="Nombre comercial" id="supplier-trade-name" placeholder="Ej. FerreMás" constraints={SupplierConstraints.tradeName}>
            <Input
              id="supplier-trade-name"
              value={form.tradeName}
              onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="NIT" id="supplier-nit" placeholder="0614-123456-101-2" constraints={SupplierConstraints.nit}>
              <Input
                id="supplier-nit"
                value={form.nit}
                onChange={(e) => setForm({ ...form, nit: e.target.value })}
              />
            </FormField>
            <FormField label="NRC" id="supplier-nrc" placeholder="123456-7" constraints={SupplierConstraints.nrc}>
              <Input
                id="supplier-nrc"
                value={form.nrc}
                onChange={(e) => setForm({ ...form, nrc: e.target.value })}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="País" required id="supplier-country" placeholder="SV" constraints={SupplierConstraints.country}>
              <Input
                id="supplier-country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </FormField>
            <FormField label="Días de crédito" id="supplier-credit-days" placeholder="0" constraints={SupplierConstraints.creditDays}>
              <Input
                id="supplier-credit-days"
                type="number"
                value={form.creditDays}
                onChange={(e) => setForm({ ...form, creditDays: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Persona de contacto" id="supplier-contact" placeholder="Ej. María López" constraints={SupplierConstraints.contactName}>
            <Input
              id="supplier-contact"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Teléfono" id="supplier-phone" placeholder="7000-0000" constraints={SupplierConstraints.phone}>
              <Input
                id="supplier-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </FormField>
            <FormField label="Correo" id="supplier-email" placeholder="ventas@proveedor.com" constraints={SupplierConstraints.email}>
              <Input
                id="supplier-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Dirección" id="supplier-address" placeholder="Calle y número" constraints={SupplierConstraints.address}>
            <Input
              id="supplier-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Municipio" id="supplier-municipality" placeholder="San Salvador" constraints={SupplierConstraints.municipality}>
              <Input id="supplier-municipality" value={form.municipality} onChange={(e) => setForm({ ...form, municipality: e.target.value })} />
            </FormField>
            <FormField label="Departamento" id="supplier-department" placeholder="San Salvador" constraints={SupplierConstraints.department}>
              <Input id="supplier-department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Notas" id="supplier-notes" placeholder="Condiciones comerciales" constraints={SupplierConstraints.notes}>
            <Textarea id="supplier-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </FormField>
          {editing ? (
            <label className="flex items-center gap-2 text-sm">
              <Input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Activo
            </label>
          ) : null}
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
        footer={
          <ModalFooter
            cancel={<Button type="button" variant="outline" onClick={() => setToggleTarget(null)}>Cancelar</Button>}
            action={<Button type="button" loading={toggling} loadingText="Guardando…" onClick={onConfirmToggle}>Confirmar</Button>}
          />
        }
      >
      </Modal>
    </div>
  );
}
