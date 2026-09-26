/**
 * Hub de accesos rápidos a reportes ya disponibles en otros módulos.
 */

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const LINKS = [
  {
    title: "Dashboard KPIs",
    href: "/dashboard",
    description: "Ventas, inventario, compras y RRHH en vivo",
  },
  {
    title: "Libros IVA",
    href: "/fiscal/libros-iva",
    description: "Ventas CF/CCF y compras · export Excel",
  },
  {
    title: "Corridas de planilla",
    href: "/planilla/corridas",
    description: "Export Excel, boletas PDF y Planilla Única",
  },
  {
    title: "Valuación inventario",
    href: "/inventario",
    description: "Stock × costo promedio y movimientos",
  },
  {
    title: "Órdenes de compra",
    href: "/compras/ordenes",
    description: "Compras recibidas del período",
  },
];

export default function ReportesPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Reportes"
        description="Accesos rápidos a reportes ya disponibles en cada módulo."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="group block">
            <Card className="h-full transition group-hover:border-primary/30 group-hover:shadow-[var(--shadow-md)]">
              <CardHeader>
                <CardTitle>{l.title}</CardTitle>
                <CardDescription>{l.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm font-medium text-primary">Abrir →</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
