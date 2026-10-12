"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { shopAuthApi } from "@/lib/api/shop-auth";
import { ShopCustomerConstraints } from "@/lib/constraints";

export default function TiendaOlvidarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setDemoToken(null);
    try {
      const result = await shopAuthApi.forgotPassword(email.trim());
      toast.success(result.message ?? "Si el correo existe, recibirás instrucciones");
      if (result.resetToken) setDemoToken(result.resetToken);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo procesar la solicitud");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Olvidé mi contraseña</CardTitle>
          <CardDescription>
            Te enviaremos un enlace para restablecer el acceso a tu cuenta de tienda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <FormField
              label="Correo"
              required
              id="shop-forgot-email"
              placeholder="cliente@ejemplo.com"
              constraints={ShopCustomerConstraints.email}
            >
              <Input
                id="shop-forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>
            <Button type="submit" className="w-full" loading={submitting} loadingText="Enviando…">
              Enviar instrucciones
            </Button>
            {/* Credenciales demo solo existen fuera de producción; no exponerlas en la tienda real. */}
            {process.env.NODE_ENV !== "production" && demoToken ? (
              <p className="break-all rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                Token demo:{" "}
                <Link
                  href={`/tienda/restablecer-contrasena?token=${encodeURIComponent(demoToken)}`}
                  className="underline hover:text-foreground"
                >
                  Restablecer ahora
                </Link>
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              <Link href="/tienda/login" className="underline hover:text-foreground">
                Volver a ingresar
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
