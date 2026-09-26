/**
 * Sesión del WebUser autenticado vía React Context.
 * Revalida `/auth/me` cuando cambia el access token (`access-token-changed`).
 * Maneja expiración automática y errores 401.
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getAccessToken } from "@/lib/api";
import { getMe } from "@/lib/api/auth";
import type { SessionUser } from "@/lib/auth";
import { expireIfNeeded } from "@/lib/token-manager";

/** Estado mínimo de sesión consumido por las protecciones de la UI. */
type SessionContextValue = {
  user: SessionUser | null;
  isLoading: boolean;
};

const SessionContext = createContext<SessionContextValue>({
  user: null,
  isLoading: true,
});

function useTokenVersion() {
  const [version, setVersion] = useState(0);
  const router = useRouter();

  useEffect(() => {
    expireIfNeeded();
    const onChange = () => setVersion((v) => v + 1);
    const onExpired = () => {
      setVersion((v) => v + 1);
      router.replace("/login");
    };
    const onUnauthorized = () => {
      setVersion((v) => v + 1);
      router.replace("/login");
    };

    window.addEventListener("access-token-changed", onChange);
    window.addEventListener("access-token-expired", onExpired);
    window.addEventListener("unauthorized", onUnauthorized);

    return () => {
      window.removeEventListener("access-token-changed", onChange);
      window.removeEventListener("access-token-expired", onExpired);
      window.removeEventListener("unauthorized", onUnauthorized);
    };
  }, [router]);

  return version;
}

/**
 * Provee `user` e `isLoading` a descendientes del área admin.
 * La expiración se procesa en efectos para no actualizar React durante el render.
 *
 * @param children - Árbol de componentes autenticados.
 * @returns Proveedor de contexto de sesión.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const tokenVersion = useTokenVersion();
  const token = typeof window !== "undefined" ? getAccessToken() : null;

  const meQuery = useQuery({
    queryKey: ["auth", "me", token, tokenVersion],
    queryFn: getMe,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <SessionContext.Provider
      value={{
        user: meQuery.data ?? null,
        isLoading: meQuery.isLoading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Accede al usuario actual; `user` es null sin token o tras logout.
 *
 * @returns Estado de sesión del área administrativa.
 */
export function useSession() {
  return useContext(SessionContext);
}
