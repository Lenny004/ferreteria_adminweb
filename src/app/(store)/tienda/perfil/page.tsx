"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { shopAuthApi } from "@/lib/api/shop-auth";
import { useShopSession } from "@/hooks/use-shop-session";

/** Página de perfil y credenciales del cliente de tienda. */
export default function PerfilTiendaPage() {
  const { status, customer } = useShopSession();
  const loggedIn = status === "authenticated";
  const ready = status !== "loading";
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (customer) {
      setFullName(customer.fullName);
      setPhone(customer.phone ?? "");
    }
  }, [customer]);

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updatedCustomer = await shopAuthApi.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
      });
      setFullName(updatedCustomer.fullName);
      setPhone(updatedCustomer.phone ?? "");
      toast.success("Perfil actualizado");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar");
    } finally {
      setSavingProfile(false);
    }
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("La confirmación no coincide");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Mínimo 8 caracteres");
      return;
    }
    setSavingPassword(true);
    try {
      await shopAuthApi.changePassword(currentPassword, newPassword);
      toast.success("Contraseña actualizada");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar");
    } finally {
      setSavingPassword(false);
    }
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!loggedIn) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Mi perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Inicia sesión para ver y editar tu perfil de tienda.</p>
          <Button asChild>
            <Link href="/tienda/login">Ingresar</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">Cuenta de cliente de la tienda.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos</CardTitle>
          <CardDescription>
            {customer?.email ?? "…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onSaveProfile}>
            <label className="grid gap-1 text-sm">
              <span>Nombre completo *</span>
              <input
                required
                className="h-10 rounded-md border border-border px-3"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Teléfono</span>
              <input
                className="h-10 rounded-md border border-border px-3"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Guardando…" : "Guardar cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cambiar contraseña</CardTitle>
          <CardDescription>Mínimo 8 caracteres</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onChangePassword}>
            <label className="grid gap-1 text-sm">
              <span>Contraseña actual *</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                className="h-10 rounded-md border border-border px-3"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Nueva contraseña *</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="h-10 rounded-md border border-border px-3"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Confirmar *</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="h-10 rounded-md border border-border px-3"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Guardando…" : "Actualizar contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
