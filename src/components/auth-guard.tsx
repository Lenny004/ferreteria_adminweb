/**
 * Bloquea el render del área admin hasta validar token y `/auth/me`.
 * Redirige a `/login` y hace logout si la sesión no es válida.
 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/api";
import { getMe, logout } from "@/lib/api/auth";

/** Pantalla de carga hasta confirmar sesión; sin token no monta hijos. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!getAccessToken()) {
          throw new Error("Sin sesión");
        }
        await getMe();
        if (mounted) setReady(true);
      } catch {
        await logout();
        if (mounted) router.replace("/login");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          Verificando sesión…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
