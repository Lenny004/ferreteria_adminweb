"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, getAccessToken } from "@/lib/api";
import { getMe, login } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("admin");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!getAccessToken()) {
          if (mounted) setChecking(false);
          return;
        }
        await getMe();
        router.replace("/dashboard");
      } catch {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(loginId.trim(), password);
      toast.success("Sesión iniciada");
      router.replace("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo iniciar sesión";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Ferreteria Admin</CardTitle>
          <CardDescription>Inicia sesión con tu usuario administrativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Usuario o correo</span>
              <input
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
                autoComplete="username"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Contraseña</span>
              <input
                type="password"
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Entrando…" : "Entrar"}
            </Button>
            <p className="text-sm text-muted-foreground">
              <Link href="/olvidar-contrasena" className="underline hover:text-foreground">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              Demo: usuario <strong>admin</strong> / contraseña <strong>admin123</strong>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
