"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { shopAuthApi } from "@/lib/api/shop-auth";

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
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Correo *</span>
              <input
                type="email"
                required
                autoComplete="email"
                className="h-10 w-full rounded-md border border-border bg-card px-3 outline-none focus:ring-2 focus:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar instrucciones"}
            </Button>
            {demoToken ? (
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
