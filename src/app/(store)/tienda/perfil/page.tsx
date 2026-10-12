"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { shopAuthApi } from "@/lib/api/shop-auth";
import { ShopCustomerConstraints, ShopCustomerCurrentPasswordConstraints, ShopCustomerPasswordConstraints } from "@/lib/constraints";
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
            <FormField
              label="Nombre completo"
              required
              id="shop-profile-name"
              placeholder="Ej. Ana López"
              constraints={ShopCustomerConstraints.fullName}
            >
              <Input
                id="shop-profile-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </FormField>
            <FormField
              label="Teléfono"
              id="shop-profile-phone"
              placeholder="Ej. 7000-0000"
              constraints={ShopCustomerConstraints.phone}
            >
              <Input
                id="shop-profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>
            <Button type="submit" loading={savingProfile} loadingText="Guardando…">
              Guardar cambios
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
            <FormField
              label="Contraseña actual"
              required
              id="shop-current-password"
              placeholder="Contraseña vigente"
              constraints={{ ...ShopCustomerConstraints.passwordHash, ...ShopCustomerCurrentPasswordConstraints }}
            >
              <Input
                id="shop-current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </FormField>
            <FormField
              label="Nueva contraseña"
              required
              id="shop-profile-new-password"
              placeholder="Mínimo 8 caracteres"
              constraints={{ ...ShopCustomerConstraints.passwordHash, ...ShopCustomerPasswordConstraints }}
            >
              <Input
                id="shop-profile-new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </FormField>
            <FormField
              label="Confirmar contraseña"
              required
              id="shop-profile-confirm-password"
              placeholder="Repite la contraseña"
              constraints={{ ...ShopCustomerConstraints.passwordHash, ...ShopCustomerPasswordConstraints }}
            >
              <Input
                id="shop-profile-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </FormField>
            <Button type="submit" loading={savingPassword} loadingText="Guardando…">
              Actualizar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
