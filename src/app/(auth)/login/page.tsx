"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          Cargando…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-md)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-secondary/20 blur-3xl"
          />
          <div className="relative space-y-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
              F
            </div>
            <div className="space-y-3">
              <p className="text-3xl font-semibold tracking-tight">Ferreteria</p>
              <p className="max-w-sm text-sm leading-relaxed text-sidebar-muted">
                Operaciones, inventario, planilla y fiscal en un solo panel administrativo.
              </p>
            </div>
          </div>
          <p className="relative text-xs text-sidebar-muted">AdminWeb · acceso interno</p>
        </div>

        <Card className="border-0 shadow-none">
          <CardHeader className="space-y-2 p-8 pb-4 sm:p-10 sm:pb-4">
            <CardTitle className="text-2xl font-semibold tracking-tight">Iniciar sesión</CardTitle>
            <CardDescription>
              Usa tu usuario administrativo para entrar al panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-2 sm:p-10 sm:pt-2">
            <form className="space-y-4" onSubmit={onSubmit}>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-foreground">Usuario o correo *</span>
                <Input
                  autoComplete="username"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-foreground">Contraseña *</span>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <Button type="submit" className="h-11 w-full" disabled={submitting}>
                {submitting ? "Entrando…" : "Entrar"}
              </Button>
              <p className="text-sm text-muted-foreground">
                <Link href="/olvidar-contrasena" className="font-medium text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>
              <p className="rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
                Demo: usuario <strong className="text-foreground">admin</strong> / contraseña{" "}
                <strong className="text-foreground">admin123</strong>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
