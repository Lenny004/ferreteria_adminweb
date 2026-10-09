"use client";

/**
 * Perfil del WebUser autenticado: datos de sesión y cambio de contraseña.
 */

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useSession } from "@/contexts/session-context";
import { ApiError } from "@/lib/api";
import { changePassword } from "@/lib/api/auth";
import { AdminPasswordConstraints, WebUserConstraints } from "@/lib/constraints";

export default function PerfilContent() {
  const { user } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("La confirmación no coincide");
      return;
    }
    const minimumPasswordLength = AdminPasswordConstraints.minLength ?? 0;
    if (newPassword.length < minimumPasswordLength) {
      toast.error(`Mínimo ${minimumPasswordLength} caracteres`);
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Contraseña actualizada");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg page-stack">
      <PageHeader
        title="Mi perfil"
        description="Cuenta de acceso al AdminWeb (WebUser)."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sesión</CardTitle>
          <CardDescription>Datos del usuario autenticado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Usuario</span>
            <span className="font-medium">{user?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Correo</span>
            <span className="font-medium">{user?.email ?? "—"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Rol</span>
            <span className="font-medium">{user?.role ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cambiar contraseña</CardTitle>
          <CardDescription>Mínimo 8 caracteres</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <FormField label="Contraseña actual" name="currentPassword" required={WebUserConstraints.passwordHash.required} placeholder="Contraseña actual" constraints={WebUserConstraints.passwordHash}>
              <Input
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </FormField>
            <FormField label="Nueva contraseña" name="newPassword" required={AdminPasswordConstraints.required} placeholder="Mínimo 8 caracteres" constraints={AdminPasswordConstraints}>
              <Input
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </FormField>
            <FormField label="Confirmar contraseña" name="confirmPassword" required={AdminPasswordConstraints.required} placeholder="Repite la nueva contraseña" constraints={AdminPasswordConstraints}>
              <Input
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Actualizar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
