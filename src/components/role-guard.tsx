"use client";

/** Guardas visuales de rol para el área administrativa. */

import { AlertTriangle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/contexts/session-context";
import type { WebUserRole } from "@/lib/auth";
import { canAccessRoute } from "@/lib/role-permissions";

/** Propiedades para restringir contenido a roles concretos. */
type RoleGuardProps = {
  children: React.ReactNode;
  allowedRoles: WebUserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
};

function AccessDenied({ message = "Tu rol no tiene permisos para acceder a esta sección." }: { message?: string }) {
  const router = useRouter();
  return (
    <div className="flex min-h-[400px] items-center justify-center px-4">
      <div className="max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Acceso denegado</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

/**
 * Protege un fragmento de UI y muestra una pantalla accesible si el rol no coincide.
 *
 * @param children - Contenido visible para roles permitidos.
 * @param allowedRoles - Roles autorizados por la política actual del panel.
 * @param redirectTo - Ruta opcional para redirigir tras denegar el acceso.
 * @param fallback - Contenido alternativo opcional.
 * @returns Contenido protegido o estado de acceso denegado.
 */
export function RoleGuard({ children, allowedRoles, redirectTo, fallback }: RoleGuardProps) {
  const { user, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role) && redirectTo) {
      router.replace(redirectTo);
    }
  }, [user, isLoading, allowedRoles, redirectTo, router]);

  if (isLoading) {
    return <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">Verificando permisos…</div>;
  }
  if (!user) return null;
  if (!allowedRoles.includes(user.role)) {
    return fallback ?? <AccessDenied message="No tienes permisos para acceder a esta sección. Contacta al administrador si consideras que es un error." />;
  }
  return <>{children}</>;
}

/** Propiedades para aplicar la matriz de rutas al contenido actual. */
type RouteProtectionProps = { children: React.ReactNode };

/**
 * Aplica la matriz de permisos a la ruta actual del área admin.
 *
 * @param children - Contenido de la ruta.
 * @returns Contenido protegido o pantalla de acceso denegado.
 */
export function RouteProtection({ children }: RouteProtectionProps) {
  const { user, isLoading } = useSession();
  const pathname = usePathname();
  if (isLoading || !user) {
    return <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">Verificando permisos…</div>;
  }
  return canAccessRoute(pathname, user.role) ? <>{children}</> : <AccessDenied />;
}
