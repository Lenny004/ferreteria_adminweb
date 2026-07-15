"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getAccessToken } from "@/lib/api";
import { getMe } from "@/lib/api/auth";
import type { SessionUser } from "@/lib/auth";

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
  useEffect(() => {
    const onChange = () => setVersion((v) => v + 1);
    window.addEventListener("access-token-changed", onChange);
    return () => window.removeEventListener("access-token-changed", onChange);
  }, []);
  return version;
}

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

export function useSession() {
  return useContext(SessionContext);
}
