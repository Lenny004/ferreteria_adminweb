"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { employeeDetailApi } from "@/lib/api/employee-detail";
import { formatMoney } from "@/lib/utils";

export default function FichaEmpleadoContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useQuery({
    queryKey: ["employee", id],
    queryFn: () => employeeDetailApi.getById(id),
    enabled: !!id,
  });

  const e = query.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {e ? `${e.firstName} ${e.lastName}` : "Ficha de empleado"}
          </h1>
          <p className="text-sm text-muted-foreground">Datos laborales y accesos al expediente</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/empleados">Directorio</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/empleados/${id}/bancos`}>Bancos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/empleados/${id}/documentos`}>Documentos</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos generales</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : !e ? (
            <p className="text-sm text-muted-foreground">Empleado no encontrado.</p>
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-muted-foreground">DUI</dt>
                <dd>{e.dui ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">NIT</dt>
                <dd>{e.nit ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Departamento</dt>
                <dd>{e.department?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Puesto</dt>
                <dd>{e.position?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contrato</dt>
                <dd>{e.contractType}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Salario</dt>
                <dd>
                  {formatMoney(e.baseSalary)} · {e.salaryType}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Ingreso</dt>
                <dd>{e.hireDate.slice(0, 10)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Estado</dt>
                <dd>{e.isActive ? "Activo" : "Inactivo"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contacto</dt>
                <dd>
                  {e.phone ?? "—"} · {e.email ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Caja / venta</dt>
                <dd>
                  {e.canCashier ? "Cajero" : "—"}
                  {e.canSell ? " · Vendedor" : ""}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
