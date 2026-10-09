"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { shopAuthApi } from "@/lib/api/shop-auth";
import { ShopCustomerConstraints, ShopCustomerPasswordConstraints } from "@/lib/constraints";
import { useShopSession } from "@/hooks/use-shop-session";

/** Formulario de login de tienda; redirige al perfil si `/me` confirma sesión. */
export default function TiendaLoginPage() {
  const router = useRouter();
  const { status } = useShopSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/tienda/perfil");
  }, [router, status]);

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
            <FormField
              label="Correo"
              required
              id="shop-login-email"
              placeholder="cliente@ejemplo.com"
              constraints={ShopCustomerConstraints.email}
            >
              <Input
                id="shop-login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>
            <FormField
              label="Contraseña"
              required
              id="shop-login-password"
              placeholder="Escribe tu contraseña"
              constraints={{ ...ShopCustomerConstraints.passwordHash, ...ShopCustomerPasswordConstraints }}
            >
              <Input
                id="shop-login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormField>
            <Button type="submit" className="w-full" loading={submitting} loadingText="Entrando…">
              Entrar
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
