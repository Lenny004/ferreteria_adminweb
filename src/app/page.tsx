"use client";

/**
 * Entrada `/`: dashboard si `/auth/me` valida la cookie admin; si no, tienda pública.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/api/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    getMe().then(() => router.replace("/dashboard")).catch(() => router.replace("/tienda"));
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Cargando…
    </div>
  );
}
