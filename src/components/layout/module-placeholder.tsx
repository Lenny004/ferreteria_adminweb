/**
 * Placeholder de módulo aún no implementado.
 * Permite publicar rutas del ERP (Employee, Payroll, Order, etc.) sin UI de negocio.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ModulePlaceholderProps = {
  /** Título visible del módulo de negocio. */
  title: string;
  /** Contexto o alcance previsto de la pantalla. */
  description?: string;
};

/**
 * Página temporal mientras se desarrolla el módulo real.
 * Evita 404s en la estructura de rutas ya definida.
 */
export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-medium text-primary">Modulo</p>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Estructura lista para desarrollo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {description ?? "Punto de entrada creado para implementar la pagina del modulo."}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
