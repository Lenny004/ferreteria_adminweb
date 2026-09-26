/**
 * Guard para proteger componentes/páginas por rol.
 * Muestra un mensaje de acceso denegado si el usuario no tiene el rol requerido.
 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/contexts/session-context";
import type { WebUserRole } from "@/lib/auth";
import { canAccessRoute } from "@/lib/role-permissions";

type RoleGuardProps = {
  children: React.ReactNode;
  allowedRoles: WebUserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
};

export function RoleGuard({ children, allowedRoles, redirectTo, fallback }: RoleGuardProps) {
  const { user, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      if (redirectTo) {
        router.replace(redirectTo);
      }
    }
  }, [user, isLoading, allowedRoles, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          Verificando permisos…
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex min-h-[400px] items-center justify-center px-4">
        <div className="max-w-md space-y-4 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Acceso denegado</h2>
            <p className="text-sm text-muted-foreground">
              No tienes permisos para acceder a esta sección. Contacta al administrador si
              consideras que es un error.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

type RouteProtectionProps = {
  children: React.ReactNode;
  pathname: string;
};

export function RouteProtection({ children, pathname }: RouteProtectionProps) {
  const { user, isLoading } = useSession();

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          Verificando permisos…
        </div>
      </div>
    );
  }

  if (!canAccessRoute(pathname, user.role)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-4">
        <div className="max-w-md space-y-4 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Acceso denegado</h2>
            <p className="text-sm text-muted-foreground">
              Tu rol no tiene permisos para acceder a esta sección.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
