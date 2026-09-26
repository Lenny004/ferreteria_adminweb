/**
 * Importaciones masivas — por ahora el flujo JSON de inventario vive en /inventario.
 * Excel nativo queda como mejora futura.
 */

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ImportacionesPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Importaciones"
        description="Entrada masiva de movimientos de inventario (API JSON). Excel nativo pendiente."
      />
      <Card>
        <CardHeader>
          <CardTitle>Inventario</CardTitle>
          <CardDescription>
            Usa el módulo de inventario para registrar entradas/ajustes; el endpoint{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              POST /api/v1/inventory/import
            </code>{" "}
            acepta líneas por código de producto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/inventario">Ir a inventario</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
