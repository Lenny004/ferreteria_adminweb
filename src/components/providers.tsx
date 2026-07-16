/**
 * Proveedores globales de la app (TanStack Query + toasts Sonner).
 */
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, refetchOnWindowFocus: true, retry: 1 },
    },
  });
}

/** Envuelve el árbol raíz con QueryClient y notificaciones. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </QueryClientProvider>
  );
}
