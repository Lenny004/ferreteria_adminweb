"use client";

/**
 * Migas de pan dinámicas según la ruta actual.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationGroups } from "@/config/navigation";

const LABEL_OVERRIDES: Record<string, string> = {
  dashboard: "Dashboard",
  reportes: "Reportes",
  "mensajes-contacto": "Mensajes",
  empleados: "Empleados",
  rrhh: "RRHH",
  bancos: "Bancos",
  "tipos-documento": "Tipos documento",
  feriados: "Feriados",
  planilla: "Planilla",
  periodos: "Periodos",
  corridas: "Corridas",
  aguinaldo: "Aguinaldo",
  vacaciones: "Vacaciones",
  liquidaciones: "Liquidaciones",
  inventario: "Inventario",
  compras: "Compras",
  proveedores: "Proveedores",
  ordenes: "Órdenes",
  clientes: "Clientes",
  importaciones: "Importaciones",
  fiscal: "Fiscal",
  "libros-iva": "Libros IVA",
  perfil: "Mi perfil",
};

function labelForSegment(segment: string) {
  return LABEL_OVERRIDES[segment] ?? segment.replace(/-/g, " ");
}

function findNavTitle(pathname: string) {
  for (const group of navigationGroups) {
    for (const item of group.items) {
      if (item.children?.length) {
        const child = item.children.find(
          (c) => pathname === c.href || pathname.startsWith(`${c.href}/`),
        );
        if (child) return { group: group.title, parent: item.title, leaf: child.title };
      }
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return { group: group.title, parent: item.title, leaf: null as string | null };
      }
    }
  }
  return null;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const match = findNavTitle(pathname);
  const segments = pathname.split("/").filter(Boolean);

  if (match) {
    return (
      <nav aria-label="Breadcrumb" className="min-w-0 text-sm">
        <ol className="flex items-center gap-1.5 truncate text-muted-foreground">
          <li className="hidden sm:inline">{match.group}</li>
          <li aria-hidden="true" className="hidden sm:inline text-border">
            /
          </li>
          <li className="truncate font-medium text-foreground">
            {match.leaf ? (
              <>
                <span className="hidden text-muted-foreground md:inline">
                  {match.parent}
                  <span className="mx-1.5 text-border">/</span>
                </span>
                {match.leaf}
              </>
            ) : (
              match.parent
            )}
          </li>
        </ol>
      </nav>
    );
  }

  const last = segments[segments.length - 1];
  return (
    <nav aria-label="Breadcrumb" className="min-w-0 text-sm">
      <ol className="flex items-center gap-1.5 truncate text-muted-foreground">
        <li>
          <Link href="/dashboard" className="hover:text-foreground">
            Admin
          </Link>
        </li>
        {last ? (
          <>
            <li aria-hidden="true" className="text-border">
              /
            </li>
            <li className="truncate font-medium capitalize text-foreground">
              {labelForSegment(last)}
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}
