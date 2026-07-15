"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi, type CreateMovementInput } from "@/lib/api/inventory";
import { productsApi } from "@/lib/api/products";

const MOVEMENTS_KEY = ["inventory", "movements"] as const;
const ALERTS_KEY = ["inventory", "alerts"] as const;

export function useInventoryMovements() {
  return useQuery({
    queryKey: MOVEMENTS_KEY,
    queryFn: () => inventoryApi.listMovements(),
  });
}

export function useStockAlerts(resolved = false) {
  return useQuery({
    queryKey: [...ALERTS_KEY, resolved],
    queryFn: () => inventoryApi.listAlerts(resolved),
  });
}

export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMovementInput) => inventoryApi.createMovement(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MOVEMENTS_KEY });
      qc.invalidateQueries({ queryKey: ALERTS_KEY });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.resolveAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ALERTS_KEY }),
  });
}

export function useProductsForInventory() {
  return useQuery({
    queryKey: ["products", "inventory-picker"],
    queryFn: () => productsApi.list({ take: 200 }),
  });
}
