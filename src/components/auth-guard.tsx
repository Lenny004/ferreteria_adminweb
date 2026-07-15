"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/api";
import { getMe, logout } from "@/lib/api/auth";

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
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Verificando sesión…
      </div>
    );
  }

  return <>{children}</>;
}
