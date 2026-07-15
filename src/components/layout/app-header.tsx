"use client";

/**
 * Encabezado sticky del área autenticada.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileNav } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/session-context";
import { logout } from "@/lib/api/auth";

export function AppHeader() {
  const { user } = useSession();
  const router = useRouter();

  async function onLogout() {
    await logout();
    toast.success("Sesión cerrada");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNav />
          <Breadcrumbs />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground sm:gap-3">
          <Link
            href="/perfil"
            className="hidden max-w-[10rem] truncate hover:text-foreground sm:inline"
            title="Mi perfil"
          >
            {user?.email ?? "Sesión"}
          </Link>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground">
            {user?.role ?? "…"}
          </span>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href="/perfil">Perfil</Link>
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onLogout}>
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
