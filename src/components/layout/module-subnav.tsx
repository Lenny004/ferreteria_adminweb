"use client";

/**
 * Subnavegación horizontal entre pantallas hermanas (RRHH, Planilla, Compras).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SubnavItem = { href: string; label: string };

export function ModuleSubnav({ items }: { items: SubnavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1" aria-label="Secciones del módulo">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export const RRHH_SUBNAV: SubnavItem[] = [
  { href: "/rrhh/bancos", label: "Bancos" },
  { href: "/rrhh/tipos-documento", label: "Tipos documento" },
  { href: "/rrhh/feriados", label: "Feriados" },
];

export const PLANILLA_SUBNAV: SubnavItem[] = [
  { href: "/planilla/periodos", label: "Periodos" },
  { href: "/planilla/corridas", label: "Corridas" },
  { href: "/planilla/aguinaldo", label: "Aguinaldo" },
  { href: "/planilla/vacaciones", label: "Vacaciones" },
  { href: "/planilla/liquidaciones", label: "Liquidaciones" },
];

export const COMPRAS_SUBNAV: SubnavItem[] = [
  { href: "/compras/proveedores", label: "Proveedores" },
  { href: "/compras/ordenes", label: "Órdenes" },
];
