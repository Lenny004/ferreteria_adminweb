"use client";

/**
 * Directorio de empleados: alta/edición, roles POS (vendedor/cajero + PIN) y baja lógica.
 */
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import type { CreateEmployeeInput, EmployeeRow } from "@/lib/api/employees";
import { useDepartments, useEmployees, usePositions } from "@/hooks/use-employees";
import { formatDate, formatMoney } from "@/lib/utils";
import { EmployeeConstraints, EmployeePinConstraints } from "@/lib/constraints";

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

type EmployeeFilters = {
  q: string;
  isActive: "" | "true" | "false";
  departmentId: string;
  canSell: boolean;
  canCashier: boolean;
};

const emptyFilters: EmployeeFilters = {
  q: "",
  isActive: "",
  departmentId: "",
  canSell: false,
  canCashier: false,
};

/** Directorio de empleados con filtros, catálogos y edición de registros. */
export default function EmpleadosContent() {
  const [draft, setDraft] = useState<EmployeeFilters>(emptyFilters);
  const [filters, setFilters] = useState<EmployeeFilters>(emptyFilters);
  const [page, setPage] = useState(0);
  const { items, total, pageSize, loading, isError, error, refresh, createEmployee, updateEmployee, submitting } =
    useEmployees(
      {
        q: filters.q,
        isActive:
          filters.isActive === "" ? undefined : filters.isActive === "true",
        departmentId: filters.departmentId || undefined,
        canSell: filters.canSell || undefined,
        canCashier: filters.canCashier || undefined,
      },
      page,
    );
  const departmentsQuery = useDepartments();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [toggleTarget, setToggleTarget] = useState<EmployeeRow | null>(null);
  const [toggling, setToggling] = useState(false);

  const positionsQuery = usePositions(form.departmentId || undefined);

  function applyFilters() {
    setPage(0);
    setFilters({ ...draft, q: draft.q.trim() });
  }

  function clearFilters() {
    setDraft(emptyFilters);
    setFilters(emptyFilters);
    setPage(0);
  }

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
    };
    const pin = form.pin.trim();
    // Omitir el PIN vacío conserva el hash existente durante la edición.
    if (pin) payload.pin = pin;

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
    <div className="page-stack">
      <PageHeader
        title="Empleados"
        description="Directorio RRHH conectado a la API (`/api/v1/employees`)."
        actions={<Button onClick={openCreate}>Nuevo empleado</Button>}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Nombre, DUI, correo, estado, departamento y roles POS</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
          >
            <FormField label="Búsqueda" id="employee-search" placeholder="Ej. Administrador" constraints={EmployeeConstraints.firstName} className="sm:col-span-2 lg:col-span-1">
              <Input
                id="employee-search"
                value={draft.q}
                onChange={(e) => setDraft((f) => ({ ...f, q: e.target.value }))}
              />
            </FormField>
            <FormField label="Estado" id="employee-filter-status">
              <Select
                id="employee-filter-status"
                value={draft.isActive}
                onChange={(e) =>
                  setDraft((f) => ({
                    ...f,
                    isActive: e.target.value as EmployeeFilters["isActive"],
                  }))
                }
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </Select>
            </FormField>
            <FormField label="Departamento" id="employee-filter-department">
              <Select
                id="employee-filter-department"
                value={draft.departmentId}
                onChange={(e) => setDraft((f) => ({ ...f, departmentId: e.target.value }))}
              >
                <option value="">{departmentsQuery.isError ? "Error al cargar" : "Todos"}</option>
                {departmentOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-1">
              <Input
                type="checkbox"
                checked={draft.canSell}
                onChange={(e) => setDraft((f) => ({ ...f, canSell: e.target.checked }))}
              />
              Solo pueden vender
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-1">
              <Input
                type="checkbox"
                checked={draft.canCashier}
                onChange={(e) => setDraft((f) => ({ ...f, canCashier: e.target.checked }))}
              />
              Solo pueden caja
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
        <CardHeader className="pb-2">
          <CardTitle>
            {loading ? "Cargando…" : `${total} empleado(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="table-container">
          <table className="data-table min-w-[720px]">
            <thead className="data-table__head">
              <tr className="data-table__row">
                <th className="data-table__cell data-table__cell--heading">Nombre</th>
                <th className="data-table__cell data-table__cell--heading">Puesto</th>
                <th className="data-table__cell data-table__cell--heading">Ingreso</th>
                <th className="data-table__cell data-table__cell--heading">Salario</th>
                <th className="data-table__cell data-table__cell--heading">Estado</th>
                <th className="data-table__cell data-table__cell--heading">Acciones</th>
              </tr>
            </thead>
            <tbody className="data-table__body">
              {items.map((row) => (
                <tr key={row.id} className="data-table__row">
                  <td className="data-table__cell">
                    <div className="font-medium text-foreground">
                      {row.firstName} {row.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{row.dui ?? "Sin DUI"}</div>
                  </td>
                  <td className="data-table__cell">
                    {row.position?.name ?? "—"}
                    <div className="text-xs text-muted-foreground">
                      {row.department?.name ?? ""}
                    </div>
                  </td>
                  <td className="data-table__cell">{formatDate(row.hireDate)}</td>
                  <td className="data-table__cell">{formatMoney(row.baseSalary)}</td>
                  <td className="data-table__cell">
                    <Badge variant={row.isActive ? "success" : "muted"}>
                      {row.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="data-table__cell">
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
              {isError ? (
                <tr className="data-table__row">
                  <td colSpan={6} className="data-table__cell">
                    <QueryErrorState compact error={error} onRetry={() => void refresh()} />
                  </td>
                </tr>
              ) : !loading && items.length === 0 ? (
                <tr className="data-table__row">
                  <td colSpan={6} className="px-2 py-8 text-center text-muted-foreground data-table__cell">
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
        size="xl"
        footer={
          <ModalFooter
            cancel={<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>}
            action={<Button type="submit" form="employee-form" loading={submitting} loadingText="Guardando…">Guardar</Button>}
          />
        }
      >
            <form id="employee-form" className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
              <FormField label="Nombre" required id="employee-first-name" placeholder="Ej. Ana" constraints={EmployeeConstraints.firstName}>
                <Input
                  id="employee-first-name"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </FormField>
              <FormField label="Apellido" required id="employee-last-name" placeholder="Ej. López" constraints={EmployeeConstraints.lastName}>
                <Input
                  id="employee-last-name"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </FormField>
              <FormField label="DUI" id="employee-dui" placeholder="00000000-0" constraints={EmployeeConstraints.dui}>
                <Input
                  id="employee-dui"
                  value={form.dui}
                  onChange={(e) => setForm((f) => ({ ...f, dui: e.target.value }))}
                />
              </FormField>
              <FormField label="Fecha de ingreso" required id="employee-hire-date" placeholder="dd/mm/aaaa" constraints={EmployeeConstraints.hireDate}>
                <Input
                  id="employee-hire-date"
                  type="date"
                  value={form.hireDate}
                  onChange={(e) => setForm((f) => ({ ...f, hireDate: e.target.value }))}
                />
              </FormField>
              <FormField label="Departamento" id="employee-department">
                <Select
                  id="employee-department"
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, departmentId: e.target.value, positionId: "" }))
                  }
                >
                  <option value="">{departmentsQuery.isError ? "Error al cargar" : "—"}</option>
                  {departmentOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Puesto" id="employee-position">
                <Select
                  id="employee-position"
                  value={form.positionId}
                  onChange={(e) => setForm((f) => ({ ...f, positionId: e.target.value }))}
                >
                  <option value="">{positionsQuery.isError ? "Error al cargar" : "—"}</option>
                  {positionOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Tipo de contrato" required id="employee-contract-type" placeholder="Selecciona una opción" constraints={EmployeeConstraints.contractType}>
                <Select id="employee-contract-type" value={form.contractType} onChange={(e) => setForm((f) => ({ ...f, contractType: e.target.value }))}>
                  <option value="PLAZO_FIJO">Plazo fijo</option>
                  <option value="INDEFINIDO">Indefinido</option>
                  <option value="SERVICIOS_PROFESIONALES">Servicios profesionales</option>
                </Select>
              </FormField>
              <FormField label="Tipo de salario" required id="employee-salary-type" placeholder="Selecciona una opción" constraints={EmployeeConstraints.salaryType}>
                <Select id="employee-salary-type" value={form.salaryType} onChange={(e) => setForm((f) => ({ ...f, salaryType: e.target.value }))}>
                  <option value="QUINCENAL">Quincenal</option>
                  <option value="MENSUAL">Mensual</option>
                  <option value="SEMANAL">Semanal</option>
                </Select>
              </FormField>
              <FormField label="Salario base" required id="employee-base-salary" placeholder="500,00" constraints={EmployeeConstraints.baseSalary}>
                <Input
                  id="employee-base-salary"
                  type="number"
                  value={form.baseSalary}
                  onChange={(e) => setForm((f) => ({ ...f, baseSalary: e.target.value }))}
                />
              </FormField>
              <FormField label="PIN de caja" id="employee-pin" placeholder={editing ? "Dejar vacío para conservar" : "4 a 12 dígitos"} constraints={EmployeePinConstraints}>
                <Input
                  id="employee-pin"
                  type="password"
                  value={form.pin}
                  onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
                />
              </FormField>
              <FormField label="Teléfono" id="employee-phone" placeholder="7000-0000" constraints={EmployeeConstraints.phone}>
                <Input
                  id="employee-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </FormField>
              <FormField label="Correo" id="employee-email" placeholder="ana@empresa.com" constraints={EmployeeConstraints.email}>
                <Input
                  id="employee-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </FormField>

              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <Input
                  type="checkbox"
                  checked={form.canSell}
                  onChange={(e) => setForm((f) => ({ ...f, canSell: e.target.checked }))}
                />
                Puede vender (WPF)
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <Input
                  type="checkbox"
                  checked={form.canCashier}
                  onChange={(e) => setForm((f) => ({ ...f, canCashier: e.target.checked }))}
                />
                Puede caja (WPF)
              </label>
              {editing ? (
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <Input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
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
        title={toggleTarget?.isActive ? "Desactivar empleado" : "Activar empleado"}
        description={
          toggleTarget
            ? `${toggleTarget.isActive ? "Desactivar" : "Activar"} a ${toggleTarget.firstName} ${toggleTarget.lastName}.`
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
