"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { resetPassword } from "@/lib/api/auth";
import { PasswordResetTokenConstraints, WebUserConstraints, WebUserPasswordConstraints } from "@/lib/constraints";

function RestablecerAdminForm() {
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
      await resetPassword(token.trim(), newPassword);
      toast.success("Contraseña restablecida");
      router.replace("/login");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo restablecer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Restablecer contraseña</CardTitle>
        <CardDescription>Define una nueva contraseña para AdminWeb.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField
            label="Token"
            required
            id="admin-reset-token"
            placeholder="Pega el token recibido"
            constraints={PasswordResetTokenConstraints.tokenHash}
          >
            <Input
              id="admin-reset-token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </FormField>
          <FormField
            label="Nueva contraseña"
            required
            id="admin-new-password"
            placeholder="Mínimo 8 caracteres"
            constraints={{ ...WebUserConstraints.passwordHash, ...WebUserPasswordConstraints }}
          >
            <Input
              id="admin-new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </FormField>
          <FormField
            label="Confirmar contraseña"
            required
            id="admin-confirm-password"
            placeholder="Repite la contraseña"
            constraints={{ ...WebUserConstraints.passwordHash, ...WebUserPasswordConstraints }}
          >
            <Input
              id="admin-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </FormField>
          <Button type="submit" className="w-full" loading={submitting} loadingText="Guardando…">
            Restablecer
          </Button>
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="underline hover:text-foreground">
              Volver al login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function RestablecerContrasenaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}>
        <RestablecerAdminForm />
      </Suspense>
    </div>
  );
}
