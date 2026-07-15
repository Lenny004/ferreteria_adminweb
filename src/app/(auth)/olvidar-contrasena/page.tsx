"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { forgotPassword } from "@/lib/api/auth";

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
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Correo</span>
              <input
                type="email"
                required
                autoComplete="email"
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
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
