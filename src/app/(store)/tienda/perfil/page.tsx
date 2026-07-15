"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { getShopAccessToken, shopAuthApi } from "@/lib/api/shop-auth";

export default function PerfilTiendaPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    function sync() {
      setLoggedIn(Boolean(getShopAccessToken()));
      setReady(true);
    }
    sync();
    window.addEventListener("shop-token-changed", sync);
    return () => window.removeEventListener("shop-token-changed", sync);
  }, []);

  const meQuery = useQuery({
    queryKey: ["shop-me"],
    queryFn: () => shopAuthApi.me(),
    enabled: loggedIn,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data) {
      setFullName(meQuery.data.fullName);
      setPhone(meQuery.data.phone ?? "");
    }
  }, [meQuery.data]);

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await shopAuthApi.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
      });
      await meQuery.refetch();
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
            {meQuery.data?.email ?? "…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onSaveProfile}>
            <label className="grid gap-1 text-sm">
              <span>Nombre completo</span>
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
            <Button type="submit" disabled={savingProfile || meQuery.isLoading}>
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
              <span>Contraseña actual</span>
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
              <span>Nueva contraseña</span>
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
              <span>Confirmar</span>
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
