"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { forgotPassword } from "@/lib/api/auth";
import { WebUserConstraints } from "@/lib/constraints";

export default function OlvidarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setDemoToken(null);
    try {
      const result = await forgotPassword(email.trim());
      toast.success(result.message ?? "Si el correo existe, recibirás instrucciones");
      if (result.resetToken) setDemoToken(result.resetToken);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo procesar la solicitud");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Olvidé mi contraseña</CardTitle>
          <CardDescription>
            Restablece el acceso a tu cuenta administrativa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <FormField
              label="Correo"
              required
              id="admin-forgot-email"
              placeholder="usuario@empresa.com"
              constraints={WebUserConstraints.email}
            >
              <Input
                id="admin-forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>
            <Button type="submit" className="w-full" loading={submitting} loadingText="Enviando…">
              Enviar instrucciones
            </Button>
            {/* Credenciales demo solo existen fuera de producción; no exponerlas en el panel real. */}
            {process.env.NODE_ENV !== "production" && demoToken ? (
              <p className="break-all rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                Token demo:{" "}
                <Link
                  href={`/restablecer-contrasena?token=${encodeURIComponent(demoToken)}`}
                  className="underline hover:text-foreground"
                >
                  Restablecer ahora
                </Link>
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="underline hover:text-foreground">
                Volver al login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
