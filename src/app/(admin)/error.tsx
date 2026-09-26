"use client";

/**
 * Error boundary del área `(admin)`. Captura errores de renderizado en
 * cualquier ruta/página anidada y ofrece reintentar sin recargar la app.
 */

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 text-danger">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg">Ocurrió un error inesperado</CardTitle>
          <CardDescription>
            No se pudo cargar esta sección. Puedes intentar de nuevo; si el problema
            persiste, contacta a soporte.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => reset()}>Reintentar</Button>
        </CardContent>
      </Card>
    </div>
  );
}
