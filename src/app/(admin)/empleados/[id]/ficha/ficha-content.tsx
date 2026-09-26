"use client";

/**
 * Ficha resumen del empleado (Employee): datos laborales y enlaces al expediente.
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
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
    <div className="page-stack">
      <PageHeader
        title={e ? `${e.firstName} ${e.lastName}` : "Ficha de empleado"}
        description="Datos laborales y accesos al expediente"
        actions={
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
        }
      />

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
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">DUI</dt>
                <dd className="font-medium">{e.dui ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">NIT</dt>
                <dd className="font-medium">{e.nit ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Departamento</dt>
                <dd className="font-medium">{e.department?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Puesto</dt>
                <dd className="font-medium">{e.position?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contrato</dt>
                <dd className="font-medium">{e.contractType}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Salario</dt>
                <dd className="font-medium">
                  {formatMoney(e.baseSalary)} · {e.salaryType}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Ingreso</dt>
                <dd className="font-medium">{e.hireDate.slice(0, 10)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Estado</dt>
                <dd className="font-medium">{e.isActive ? "Activo" : "Inactivo"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contacto</dt>
                <dd className="font-medium">
                  {e.phone ?? "—"} · {e.email ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Caja / venta</dt>
                <dd className="font-medium">
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
