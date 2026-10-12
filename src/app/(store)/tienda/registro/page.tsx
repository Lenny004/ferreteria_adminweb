"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { shopAuthApi } from "@/lib/api/shop-auth";
import { ShopCustomerConstraints, ShopCustomerPasswordConstraints, ShopCustomerRegistrationNameConstraints } from "@/lib/constraints";

export default function TiendaRegistroPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setSubmitting(true);
    try {
      await shopAuthApi.register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || null,
      });
      toast.success("Cuenta creada");
      router.replace("/tienda");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo registrar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>Regístrate para favoritos y perfil de tienda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <FormField
              label="Nombre completo"
              required
              id="shop-register-name"
              placeholder="Ej. Ana López"
              constraints={ShopCustomerRegistrationNameConstraints}
            >
              <Input
                id="shop-register-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </FormField>
            <FormField
              label="Correo"
              required
              id="shop-register-email"
              placeholder="cliente@ejemplo.com"
              constraints={ShopCustomerConstraints.email}
            >
              <Input
                id="shop-register-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>
            <FormField
              label="Teléfono"
              id="shop-register-phone"
              placeholder="Ej. 7000-0000"
              constraints={ShopCustomerConstraints.phone}
            >
              <Input
                id="shop-register-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>
            <FormField
              label="Contraseña"
              required
              id="shop-register-password"
              placeholder="Mínimo 8 caracteres"
              constraints={{ ...ShopCustomerConstraints.passwordHash, ...ShopCustomerPasswordConstraints }}
            >
              <Input
                id="shop-register-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormField>
            <Button type="submit" className="w-full" loading={submitting} loadingText="Creando…">
              Registrarme
            </Button>
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link href="/tienda/login" className="underline hover:text-foreground">
                Ingresar
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
