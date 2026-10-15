"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleMarkdown } from "@/components/store/simple-markdown";
import {
  PUBLIC_SETTING_KEYS,
  publicSettingsApi,
} from "@/lib/api/public-settings";

const FALLBACK = `# Términos de servicio

## Uso del catálogo
El catálogo público de Ferreteria es informativo. Los precios y existencias pueden variar.

## Cuentas de cliente
Al registrarte aceptas proporcionar datos veraces y cuidar la confidencialidad de tu contraseña.

## Contacto
Para consultas usa el formulario de Contáctanos.`;

export default function TerminosPage() {
  const query = useQuery({
    queryKey: ["public-setting", PUBLIC_SETTING_KEYS.TermsOfService],
    queryFn: () => publicSettingsApi.getByKey(PUBLIC_SETTING_KEYS.TermsOfService),
    retry: false,
  });

  const content = query.data?.value || FALLBACK;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Términos de servicio</h1>
        <p className="text-sm text-muted-foreground">Condiciones de uso de la tienda pública.</p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Documento</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <SimpleMarkdown content={content} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
