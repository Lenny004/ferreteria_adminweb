"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleMarkdown } from "@/components/store/simple-markdown";
import {
  PUBLIC_SETTING_KEYS,
  publicSettingsApi,
} from "@/lib/api/public-settings";

const FALLBACK = `# Política de privacidad

## Datos que recopilamos
Correo, nombre y teléfono al registrarte o contactarnos.

## Uso
Usamos tus datos para responder consultas y gestionar tu cuenta de tienda.

## Conservación
No compartimos tus datos con terceros para marketing.`;

export default function PrivacidadPage() {
  const query = useQuery({
    queryKey: ["public-setting", PUBLIC_SETTING_KEYS.PrivacyPolicy],
    queryFn: () => publicSettingsApi.getByKey(PUBLIC_SETTING_KEYS.PrivacyPolicy),
    retry: false,
  });

  const content = query.data?.value || FALLBACK;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Privacidad</h1>
        <p className="text-sm text-muted-foreground">Cómo tratamos tus datos personales.</p>
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
