import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Ruta no encontrada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          La seccion solicitada no existe dentro de la estructura del ERP.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Volver al dashboard</Link>
        </Button>
      </section>
    </main>
  );
}
