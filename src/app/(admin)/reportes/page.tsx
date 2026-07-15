import Link from "next/link";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Accesos rápidos a reportes ya disponibles en cada módulo.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="block transition hover:opacity-90">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">{l.title}</CardTitle>
                <CardDescription>{l.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-primary">Abrir →</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
