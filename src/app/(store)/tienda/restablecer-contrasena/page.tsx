"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { shopAuthApi } from "@/lib/api/shop-auth";

function RestablecerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("La confirmación no coincide");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Mínimo 8 caracteres");
      return;
    }
    setSubmitting(true);
    try {
      await shopAuthApi.resetPassword(token.trim(), newPassword);
      toast.success("Contraseña restablecida");
      router.replace("/tienda/login");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo restablecer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Restablecer contraseña</CardTitle>
        <CardDescription>Elige una nueva contraseña para tu cuenta de tienda.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Token</span>
            <input
              required
              className="h-10 w-full rounded-md border border-border bg-card px-3 outline-none focus:ring-2 focus:ring-primary"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Nueva contraseña</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-10 w-full rounded-md border border-border bg-card px-3 outline-none focus:ring-2 focus:ring-primary"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Confirmar</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-10 w-full rounded-md border border-border bg-card px-3 outline-none focus:ring-2 focus:ring-primary"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Guardando…" : "Restablecer"}
          </Button>
          <p className="text-sm text-muted-foreground">
            <Link href="/tienda/login" className="underline hover:text-foreground">
              Volver a ingresar
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function TiendaRestablecerContrasenaPage() {
  return (
    <div className="mx-auto max-w-md">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}>
        <RestablecerForm />
      </Suspense>
    </div>
  );
}
