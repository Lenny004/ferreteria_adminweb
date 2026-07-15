/**
 * Importaciones masivas — por ahora el flujo JSON de inventario vive en /inventario.
 * Excel nativo queda como mejora futura.
 */

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ImportacionesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Importaciones</h1>
        <p className="text-sm text-muted-foreground">
          Entrada masiva de movimientos de inventario (API JSON). Excel nativo pendiente.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventario</CardTitle>
          <CardDescription>
            Usa el módulo de inventario para registrar entradas/ajustes; el endpoint{" "}
            <code className="text-xs">POST /api/v1/inventory/import</code> acepta líneas por código
            de producto.
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
