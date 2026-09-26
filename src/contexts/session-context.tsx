/** Contexto de sesión admin derivado exclusivamente de `/auth/me`. */
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { getMe } from "@/lib/api/auth";
import type { SessionUser } from "@/lib/auth";
import { migrateLegacySessionStorage } from "@/lib/session-state";

/** Ruta de login que muestra el aviso "Tu sesión expiró" (solo tras perder una sesión activa). */
export const SESSION_EXPIRED_LOGIN_PATH = "/login?expirada=1";

/** Estado mínimo de sesión consumido por las protecciones de la UI. */
type SessionContextValue = { user: SessionUser | null; isLoading: boolean };

const SessionContext = createContext<SessionContextValue>({ user: null, isLoading: true });

/**
 * Provee el usuario validado por cookie para el área administrativa.
 * @param children - Árbol de componentes autenticados.
 * @returns Proveedor de contexto de sesión.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    migrateLegacySessionStorage();
    const onUnauthorized = () => {
      // Se descarta la caché para que ningún dato del usuario anterior sobreviva a la sesión.
      queryClient.clear();
      router.replace(SESSION_EXPIRED_LOGIN_PATH);
    };
    window.addEventListener("unauthorized", onUnauthorized);
    return () => window.removeEventListener("unauthorized", onUnauthorized);
  }, [router, queryClient]);

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return (
    <SessionContext.Provider value={{ user: meQuery.data ?? null, isLoading: meQuery.isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}

/** Accede al usuario de sesión validado por el backend. */
export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}
