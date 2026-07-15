"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { shopAuthApi } from "@/lib/api/shop-auth";

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
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Nombre completo</span>
              <input
                required
                minLength={2}
                className="h-10 w-full rounded-md border border-border bg-card px-3 outline-none focus:ring-2 focus:ring-primary"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Correo</span>
              <input
                type="email"
                required
                autoComplete="email"
                className="h-10 w-full rounded-md border border-border bg-card px-3 outline-none focus:ring-2 focus:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Teléfono (opcional)</span>
              <input
                className="h-10 w-full rounded-md border border-border bg-card px-3 outline-none focus:ring-2 focus:ring-primary"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Contraseña</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="h-10 w-full rounded-md border border-border bg-card px-3 outline-none focus:ring-2 focus:ring-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creando…" : "Registrarme"}
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
