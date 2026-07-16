"use client";

/**
 * Encabezado sticky del área autenticada.
 */

import { LogOut, UserRound } from "lucide-react";
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
    <header className="sticky top-0 z-20 border-b border-border/80 bg-card/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNav />
          <Breadcrumbs />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            asChild
            className="hidden max-w-[220px] sm:inline-flex"
          >
            <Link href="/perfil" title="Mi perfil" className="gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UserRound className="h-3.5 w-3.5" />
              </span>
              <span className="truncate text-sm font-medium text-foreground">
                {user?.email ?? "Sesión"}
              </span>
            </Link>
          </Button>
          <span className="hidden rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:inline-flex">
            {user?.role ?? "…"}
          </span>
          <Button type="button" size="sm" variant="outline" asChild className="sm:hidden">
            <Link href="/perfil">Perfil</Link>
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onLogout}>
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
