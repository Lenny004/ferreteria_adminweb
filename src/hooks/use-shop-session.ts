"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { shopAuthApi } from "@/lib/api/shop-auth";
import {
  getShopCustomer,
  getShopSessionRevision,
  SHOP_SESSION_CHANGED_EVENT,
  type ShopCustomer,
} from "@/lib/shop-session-state";

export type ShopSessionStatus = "loading" | "authenticated" | "anonymous";

export type ShopSession = {
  status: ShopSessionStatus;
  customer: ShopCustomer | null;
};

let meRequestInFlight: Promise<ShopCustomer | null> | null = null;

/** Comparte la consulta de `/shop/auth/me` entre todos los consumidores montados. */
function resolveShopSession(): Promise<ShopCustomer | null> {
  if (!meRequestInFlight) {
    meRequestInFlight = shopAuthApi
      .me()
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      })
      .finally(() => {
        meRequestInFlight = null;
      });
  }
  return meRequestInFlight;
}

/**
 * Resuelve la sesión de tienda desde la cookie y sincroniza sus cambios.
 * Las llamadas concurrentes a `/shop/auth/me` se comparten entre componentes.
 *
 * @returns Estado de sesión y cliente validado, si existe.
 */
export function useShopSession(): ShopSession {
  const [session, setSession] = useState<ShopSession>({
    status: "loading",
    customer: getShopCustomer(),
  });

  useEffect(() => {
    let active = true;
    const revisionAtStart = getShopSessionRevision();

    const syncFromMemory = () => {
      const customer = getShopCustomer();
      setSession({
        status: customer ? "authenticated" : "anonymous",
        customer,
      });
    };

    window.addEventListener(SHOP_SESSION_CHANGED_EVENT, syncFromMemory);

    void resolveShopSession()
      .then((customer) => {
        if (!active || getShopSessionRevision() !== revisionAtStart) return;
        setSession({
          status: customer ? "authenticated" : "anonymous",
          customer,
        });
      })
      .catch(() => {
        if (active && getShopSessionRevision() === revisionAtStart) {
          setSession({ status: "anonymous", customer: null });
        }
      });

    return () => {
      active = false;
      window.removeEventListener(SHOP_SESSION_CHANGED_EVENT, syncFromMemory);
    };
  }, []);

  return session;
}
