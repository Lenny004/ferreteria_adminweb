import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ModulePlaceholderProps = {
  title: string;
  description?: string;
};

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
