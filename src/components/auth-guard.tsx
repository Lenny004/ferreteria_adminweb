/** Bloquea el área admin hasta resolver `/auth/me`, evitando parpadeo de contenido protegido. */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe } from "@/lib/api/auth";

/** Verifica la cookie de sesión antes de montar hijos protegidos. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    getMe()
      .then(() => { if (mounted) setReady(true); })
      .catch(() => { if (mounted) router.replace("/login"); });
    return () => { mounted = false; };
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
