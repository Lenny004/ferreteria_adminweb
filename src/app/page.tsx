"use client";

/**
 * Entrada `/`: dashboard si hay token admin; si no, tienda pública.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (getAccessToken()) router.replace("/dashboard");
    else router.replace("/tienda");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Cargando…
    </div>
  );
}
