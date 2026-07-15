"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api";
import type { CreateEmployeeInput, EmployeeRow } from "@/lib/api/employees";
import { useDepartments, useEmployees, usePositions } from "@/hooks/use-employees";
import { formatDate, formatMoney } from "@/lib/utils";

const emptyForm = {
  firstName: "",
  lastName: "",
  hireDate: new Date().toISOString().slice(0, 10),
  baseSalary: "500",
  dui: "",
  phone: "",
  email: "",
  departmentId: "",
  positionId: "",
  contractType: "PLAZO_FIJO",
  salaryType: "QUINCENAL",
  canSell: false,
  canCashier: false,
  pin: "",
  isActive: true,
};

export default function EmpleadosContent() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const { items, total, pageSize, loading, createEmployee, updateEmployee, submitting } =
    useEmployees(search, page);
  const departmentsQuery = useDepartments();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [toggleTarget, setToggleTarget] = useState<EmployeeRow | null>(null);
  const [toggling, setToggling] = useState(false);

  const positionsQuery = usePositions(form.departmentId || undefined);

  const title = editing ? "Editar empleado" : "Nuevo empleado";

  const departmentOptions = departmentsQuery.data ?? [];
  const positionOptions = useMemo(() => {
    if (form.departmentId) return positionsQuery.data ?? [];
    return (positionsQuery.data ?? []).filter(Boolean);
  }, [form.departmentId, positionsQuery.data]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(row: EmployeeRow) {
    setEditing(row);
    setForm({
      firstName: row.firstName,
      lastName: row.lastName,
      hireDate: row.hireDate.slice(0, 10),
      baseSalary: String(row.baseSalary),
      dui: row.dui ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      departmentId: row.departmentId ?? "",
      positionId: row.positionId ?? "",
      contractType: row.contractType,
      salaryType: row.salaryType,
      canSell: row.canSell,
      canCashier: row.canCashier,
      pin: "",
      isActive: row.isActive,
    });
    setOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload: CreateEmployeeInput = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      hireDate: form.hireDate,
      baseSalary: Number(form.baseSalary),
      dui: form.dui.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      departmentId: form.departmentId || null,
      positionId: form.positionId || null,
      contractType: form.contractType,
      salaryType: form.salaryType,
      canSell: form.canSell,
      canCashier: form.canCashier,
      pin: form.pin.trim() || null,
    };

    try {
      if (editing) {
        await updateEmployee(editing.id, { ...payload, isActive: form.isActive });
        toast.success("Empleado actualizado");
      } else {
        await createEmployee(payload);
        toast.success("Empleado creado");
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
      await updateEmployee(toggleTarget.id, { isActive: !toggleTarget.isActive });
      toast.success(toggleTarget.isActive ? "Empleado desactivado" : "Empleado activado");
      setToggleTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar el estado");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Empleados</h1>
          <p className="text-sm text-muted-foreground">
            Directorio RRHH conectado a la API (`/api/v1/employees`).
          </p>
        </div>
        <Button onClick={openCreate}>Nuevo empleado</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Buscar</CardTitle>
          <CardDescription>Nombre, DUI o correo</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <input
            className="h-10 flex-1 rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej. Administrador"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPage(0);
              setSearch(q.trim());
            }}
          >
            Filtrar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {loading ? "Cargando…" : `${total} empleado(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-2 py-2 font-medium">Nombre</th>
                <th className="px-2 py-2 font-medium">Puesto</th>
                <th className="px-2 py-2 font-medium">Ingreso</th>
                <th className="px-2 py-2 font-medium">Salario</th>
                <th className="px-2 py-2 font-medium">Estado</th>
                <th className="px-2 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-border/70">
                  <td className="px-2 py-3">
                    <div className="font-medium text-foreground">
                      {row.firstName} {row.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{row.dui ?? "Sin DUI"}</div>
                  </td>
                  <td className="px-2 py-3">
                    {row.position?.name ?? "—"}
                    <div className="text-xs text-muted-foreground">
                      {row.department?.name ?? ""}
                    </div>
                  </td>
                  <td className="px-2 py-3">{formatDate(row.hireDate)}</td>
                  <td className="px-2 py-3">{formatMoney(row.baseSalary)}</td>
                  <td className="px-2 py-3">
                    <Badge variant={row.isActive ? "success" : "muted"}>
                      {row.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/empleados/${row.id}/ficha`}>Ficha</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setToggleTarget(row)}
                      >
                        {row.isActive ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-8 text-center text-muted-foreground">
                    No hay empleados para mostrar.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={title}
        description="Campos mínimos. El PIN se hashea en el backend."
        size="2xl"
      >
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
              <label className="space-y-1 text-sm">
                <span>Nombre</span>
                <input
                  required
                  className="h-10 w-full rounded-md border border-border px-3"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Apellido</span>
                <input
                  required
                  className="h-10 w-full rounded-md border border-border px-3"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>DUI</span>
                <input
                  className="h-10 w-full rounded-md border border-border px-3"
                  value={form.dui}
                  onChange={(e) => setForm((f) => ({ ...f, dui: e.target.value }))}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Fecha ingreso</span>
                <input
                  type="date"
                  required
                  className="h-10 w-full rounded-md border border-border px-3"
                  value={form.hireDate}
                  onChange={(e) => setForm((f) => ({ ...f, hireDate: e.target.value }))}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Departamento</span>
                <select
                  className="h-10 w-full rounded-md border border-border px-3"
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, departmentId: e.target.value, positionId: "" }))
                  }
                >
                  <option value="">—</option>
                  {departmentOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span>Puesto</span>
                <select
                  className="h-10 w-full rounded-md border border-border px-3"
                  value={form.positionId}
                  onChange={(e) => setForm((f) => ({ ...f, positionId: e.target.value }))}
                >
                  <option value="">—</option>
                  {positionOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span>Salario base</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  className="h-10 w-full rounded-md border border-border px-3"
                  value={form.baseSalary}
                  onChange={(e) => setForm((f) => ({ ...f, baseSalary: e.target.value }))}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>PIN caja (opcional)</span>
                <input
                  type="password"
                  className="h-10 w-full rounded-md border border-border px-3"
                  value={form.pin}
                  onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
                  placeholder={editing ? "Dejar vacío para no cambiar" : ""}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Teléfono</span>
                <input
                  className="h-10 w-full rounded-md border border-border px-3"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Correo</span>
                <input
                  type="email"
                  className="h-10 w-full rounded-md border border-border px-3"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </label>

              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.canSell}
                  onChange={(e) => setForm((f) => ({ ...f, canSell: e.target.checked }))}
                />
                Puede vender (WPF)
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.canCashier}
                  onChange={(e) => setForm((f) => ({ ...f, canCashier: e.target.checked }))}
                />
                Puede caja (WPF)
              </label>
              {editing ? (
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  Activo
                </label>
              ) : null}

              <div className="flex justify-end gap-2 sm:col-span-2">
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
        title={toggleTarget?.isActive ? "Desactivar empleado" : "Activar empleado"}
        description={
          toggleTarget
            ? `${toggleTarget.isActive ? "Desactivar" : "Activar"} a ${toggleTarget.firstName} ${toggleTarget.lastName}.`
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
