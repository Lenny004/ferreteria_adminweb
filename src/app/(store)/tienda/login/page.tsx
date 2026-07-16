"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { getShopAccessToken, shopAuthApi } from "@/lib/api/shop-auth";

export default function TiendaLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getShopAccessToken()) router.replace("/tienda/perfil");
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await shopAuthApi.login(email.trim(), password);
      toast.success("Sesión iniciada");
      router.replace("/tienda");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Ingresar</CardTitle>
          <CardDescription>Accede a tu cuenta de cliente Ferreteria.</CardDescription>
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
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Contraseña *</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                className="h-10 w-full rounded-md border border-border bg-card px-3 outline-none focus:ring-2 focus:ring-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Entrando…" : "Entrar"}
            </Button>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <Link href="/tienda/olvidar-contrasena" className="underline hover:text-foreground">
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>
              <p>
                ¿No tienes cuenta?{" "}
                <Link href="/tienda/registro" className="underline hover:text-foreground">
                  Regístrate
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
