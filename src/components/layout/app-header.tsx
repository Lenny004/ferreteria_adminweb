"use client";

/**
 * Encabezado sticky del área autenticada.
 */

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
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
        <div className="min-w-0">
          <Breadcrumbs />
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="hidden sm:inline">{user?.email ?? "Sesión"}</span>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground">
            {user?.role ?? "…"}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={onLogout}>
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
